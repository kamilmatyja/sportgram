<?php

declare(strict_types=1);

namespace Tests\Unit\EventSubscriber;

use App\Entity\UserSign;
use App\Enum\{LanguageEnum, UnauthorizedStatusEnum};
use App\Event\UserSignEmailEvent;
use App\EventSubscriber\UserSignEmailSubscriber;
use App\Repository\UserSignRepository;
use App\Service\EmailService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Factory\{UserFactory, UserSignFactory};

class UserSignEmailSubscriberTest extends TestCase
{
    private EmailService&MockObject $emailService;

    private UserSignRepository&MockObject $userSignRepository;

    private UserSignEmailSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->emailService = $this->createMock(EmailService::class);
        $this->userSignRepository = $this->createMock(UserSignRepository::class);

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static fn (string $id, array $parameters = [], ?string $domain = null, ?string $locale = null): string => $locale . '|' . $id . '|' . implode(',', $parameters),
        );

        $this->subscriber = new UserSignEmailSubscriber($this->emailService, $translator, $this->userSignRepository);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testSubscribesToUserSignEmailEvent(): void
    {
        $this->assertSame(
            [UserSignEmailEvent::class => 'onUserSignEmail'],
            UserSignEmailSubscriber::getSubscribedEvents(),
        );
    }

    final public function testSendsTranslatedEmailAndMarksAsSent(): void
    {
        $user = UserFactory::make(['email' => 'jan@kowalski.pl', 'language' => LanguageEnum::Polish]);
        $userSign = UserSignFactory::make(['user' => $user, 'code' => 123456, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())
            ->method('send')
            ->with('jan@kowalski.pl', 'pl|sign.code.subject|', 'pl|sign.code.body|123456');
        $this->userSignRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(
                static fn (UserSign $saved): bool => $saved === $userSign && UnauthorizedStatusEnum::Sent === $saved->status,
            ));

        $this->subscriber->onUserSignEmail(new UserSignEmailEvent($user, $userSign));

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userSign->status);
    }

    final public function testMarksAsSentEvenWhenSendingFails(): void
    {
        $user = UserFactory::make();
        $userSign = UserSignFactory::make(['user' => $user, 'status' => UnauthorizedStatusEnum::NotSent]);

        $this->emailService->expects($this->once())->method('send')->willThrowException(new RuntimeException('SMTP down'));
        $this->userSignRepository->expects($this->once())->method('save')->with($userSign);

        try {
            $this->subscriber->onUserSignEmail(new UserSignEmailEvent($user, $userSign));
            $this->fail('Exception from email service should be rethrown.');
        } catch (RuntimeException $e) {
            $this->assertSame('SMTP down', $e->getMessage());
        }

        $this->assertSame(UnauthorizedStatusEnum::Sent, $userSign->status);
    }
}
