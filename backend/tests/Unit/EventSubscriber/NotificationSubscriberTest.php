<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\Entity\{Notification, User};
use App\Enum\{LanguageEnum, NotificationStatusEnum, NotificationTypeEnum, PushSubscriptionStatusEnum};
use App\Event\NotificationEvent;
use App\EventSubscriber\NotificationSubscriber;
use App\Repository\{NotificationRepository, PushSubscriptionRepository};
use App\Service\WebPushService;
use Doctrine\ORM\Tools\Pagination\{Window, WindowPage};
use ErrorException;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\{MockObject, Stub};
use PHPUnit\Framework\TestCase;
use Symfony\Component\Uid\Uuid;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Factory\{PushSubscriptionFactory, UserFactory};

class NotificationSubscriberTest extends TestCase
{
    private NotificationRepository&MockObject $notificationRepository;

    private PushSubscriptionRepository&Stub $pushSubscriptionRepository;

    private WebPushService&MockObject $webPushService;

    private TranslatorInterface&MockObject $translator;

    private NotificationSubscriber $subscriber;

    private User $user;

    /** @var array{NotificationStatusEnum, Notification}[] */
    private array $savedNotifications = [];

    protected function setUp(): void
    {
        $this->notificationRepository = $this->createMock(NotificationRepository::class);
        $this->pushSubscriptionRepository = $this->createStub(PushSubscriptionRepository::class);
        $this->webPushService = $this->createMock(WebPushService::class);
        $this->translator = $this->createMock(TranslatorInterface::class);

        $this->subscriber = new NotificationSubscriber(
            $this->notificationRepository,
            $this->pushSubscriptionRepository,
            $this->webPushService,
            $this->translator,
        );

        $this->user = UserFactory::make(['language' => LanguageEnum::English]);
        $this->user->id = Uuid::v7();
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToNotificationEvent(): void
    {
        $this->assertSame(
            [NotificationEvent::class => 'onNotification'],
            NotificationSubscriber::getSubscribedEvents(),
        );
    }

    final public function testSavesTranslatedNotificationAndPushesToEverySubscription(): void
    {
        $event = new NotificationEvent($this->user, NotificationTypeEnum::GoalResult, 'Goal', '/goals/my-goal');
        $subscriptions = [
            PushSubscriptionFactory::make(['user' => $this->user, 'status' => PushSubscriptionStatusEnum::Active]),
            PushSubscriptionFactory::make(['user' => $this->user, 'status' => PushSubscriptionStatusEnum::Active]),
        ];
        $this->givenSubscriptions($subscriptions);

        $this->translator->expects($this->once())
            ->method('trans')
            ->with('notification.body.GoalResult', ['%text%' => $event->getText()], null, 'en')
            ->willReturn('Translated body');

        $payload = json_encode(['title' => 'Sportgram', 'body' => 'Translated body', 'link' => '/goals/my-goal']);
        $sent = [];
        $this->webPushService->expects($this->exactly(2))
            ->method('sendNotification')
            ->willReturnCallback(function (string ...$args) use (&$sent): bool {
                $sent[] = $args;

                return true;
            });
        $this->recordSavedNotifications(2);

        $this->subscriber->onNotification($event);

        $this->assertSame([
            [$subscriptions[0]->endpoint, $subscriptions[0]->p256dh, $subscriptions[0]->auth, $payload],
            [$subscriptions[1]->endpoint, $subscriptions[1]->p256dh, $subscriptions[1]->auth, $payload],
        ], $sent);
        $this->assertNotificationSavedThenMarkedSent('Translated body', '/goals/my-goal');
    }

    final public function testMarksNotificationSentWhenUserHasNoSubscriptions(): void
    {
        $this->givenSubscriptions([]);
        $this->translator->expects($this->once())->method('trans')->willReturn('Body');
        $this->webPushService->expects($this->never())->method('sendNotification');
        $this->recordSavedNotifications(2);

        $this->subscriber->onNotification(
            new NotificationEvent($this->user, NotificationTypeEnum::Friend, null, null),
        );

        $this->assertNotificationSavedThenMarkedSent('Body', null);
    }

    final public function testMarksNotificationSentEvenWhenPushFails(): void
    {
        $this->givenSubscriptions([PushSubscriptionFactory::make(['user' => $this->user])]);
        $this->translator->expects($this->once())->method('trans')->willReturn('Body');
        $this->webPushService->expects($this->once())
            ->method('sendNotification')
            ->willThrowException(new ErrorException('Push failed'));
        $this->recordSavedNotifications(2);

        try {
            $this->subscriber->onNotification(
                new NotificationEvent($this->user, NotificationTypeEnum::Friend, 'text', '/friends'),
            );
            $this->fail('Exception from web push should be rethrown.');
        } catch (ErrorException $e) {
            $this->assertSame('Push failed', $e->getMessage());
        }

        $this->assertNotificationSavedThenMarkedSent('Body', '/friends');
    }

    final public function testUsesUserLocale(): void
    {
        $user = UserFactory::make(['language' => LanguageEnum::Polish]);
        $user->id = Uuid::v7();
        $this->givenSubscriptions([], $user);
        $this->webPushService->expects($this->never())->method('sendNotification');
        $this->translator->expects($this->once())
            ->method('trans')
            ->with('notification.body.FeedComment', $this->anything(), null, 'pl')
            ->willReturn('Treść');
        $this->recordSavedNotifications(2);

        $this->subscriber->onNotification(new NotificationEvent($user, NotificationTypeEnum::FeedComment, 'x', null));

        $this->assertSame($user, $this->savedNotifications[0][1]->user);
        $this->assertSame('Treść', $this->savedNotifications[0][1]->text);
    }

    private function givenSubscriptions(array $subscriptions, ?User $user = null): void
    {
        $expectedUserId = ($user ?? $this->user)->id;
        $this->pushSubscriptionRepository->method('findActiveByUserId')
            ->willReturnCallback(function (Uuid $userId) use ($subscriptions, $expectedUserId): WindowPage {
                $this->assertTrue($userId->equals($expectedUserId));

                return new WindowPage($subscriptions, count($subscriptions), new Window(0, PHP_INT_MAX));
            });
    }

    private function recordSavedNotifications(int $times): void
    {
        $this->notificationRepository->expects($this->exactly($times))
            ->method('save')
            ->willReturnCallback(function (Notification $notification): void {
                $this->savedNotifications[] = [$notification->status, $notification];
            });
    }

    private function assertNotificationSavedThenMarkedSent(string $text, ?string $link): void
    {
        [[$firstStatus, $notification], [$secondStatus, $sameNotification]] = $this->savedNotifications;

        $this->assertSame($notification, $sameNotification);
        $this->assertSame(NotificationStatusEnum::NotSent, $firstStatus);
        $this->assertSame(NotificationStatusEnum::Sent, $secondStatus);
        $this->assertSame($this->user, $notification->user);
        $this->assertSame($text, $notification->text);
        $this->assertSame($link, $notification->link);
    }
}
