<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{ConversationActivityIndexDto, ConversationDto, ConversationIndexDto, ConversationStatusDto};
use App\Entity\{Conversation, ConversationActivity, User};
use App\Enum\{ConversationStatusEnum, NotificationTypeEnum};
use App\Repository\{ConversationActivityRepository, ConversationRepository, FriendRepository, UserRepository};
use App\Service\ConversationService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{ConversationActivityFactory, ConversationFactory, UserFactory};

#[AllowMockObjectsWithoutExpectations]
class ConversationServiceTest extends ServiceTestCase
{
    private ConversationRepository&MockObject $conversationRepository;

    private ConversationActivityRepository&MockObject $conversationActivityRepository;

    private UserRepository&MockObject $userRepository;

    private FriendRepository&MockObject $friendRepository;

    private User $currentUser;

    private ConversationService $service;

    protected function setUp(): void
    {
        $this->conversationRepository = $this->createMock(ConversationRepository::class);
        $this->conversationActivityRepository = $this->createMock(ConversationActivityRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new ConversationService(
            $this->conversationRepository,
            $this->conversationActivityRepository,
            $this->userRepository,
            $this->friendRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesSentConversationAndNotifiesReceiver(): void
    {
        $receiver = self::entity(UserFactory::make(['link' => 'anna']));
        $dto = new ConversationDto();
        $dto->text = 'Hello Anna';
        $this->userRepository->expects($this->once())->method('findById')->with($receiver->id)->willReturn($receiver);
        $this->friendRepository->expects($this->once())
            ->method('isFriend')
            ->with($this->currentUser->id, $receiver->id)
            ->willReturn(true);
        $saved = null;
        $this->conversationRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Conversation $conversation) use (&$saved): void {
                $saved = $conversation;
                self::persist()($conversation);
            });

        $id = $this->service->create($receiver->id, $dto);

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->senderUser);
        $this->assertSame($receiver, $saved->receiverUser);
        $this->assertSame('Hello Anna', $saved->text);
        $this->assertSame(ConversationStatusEnum::Sent, $saved->status);
        $this->assertNotifications([[$receiver, NotificationTypeEnum::Conversation, 'Hello Anna', '/users/anna/conversations']]);
    }

    final public function testCreateRejectsNonFriend(): void
    {
        $receiver = self::user();
        $dto = new ConversationDto();
        $dto->text = 'Hello';
        $this->userRepository->expects($this->once())->method('findById')->willReturn($receiver);
        $this->friendRepository->expects($this->once())->method('isFriend')->willReturn(false);
        $this->conversationRepository->expects($this->never())->method('save');

        try {
            $this->service->create($receiver->id, $dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User is not friend.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateFailsForUnknownReceiver(): void
    {
        $dto = new ConversationDto();
        $dto->text = 'Hello';
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->friendRepository->expects($this->never())->method('isFriend');
        $this->conversationRepository->expects($this->never())->method('save');

        try {
            $this->service->create(self::user()->id, $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateSavesText(): void
    {
        $conversation = self::entity(ConversationFactory::make(['text' => 'old', 'status' => ConversationStatusEnum::Read]));
        $dto = new ConversationDto();
        $dto->text = 'new';
        $this->conversationRepository->expects($this->once())->method('findById')->with($conversation->id)->willReturn($conversation);
        $this->conversationRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Conversation $saved): bool => $saved === $conversation && 'new' === $saved->text));

        $this->assertSame($conversation->id, $this->service->update($conversation->id, $dto));
        $this->assertSame(ConversationStatusEnum::Read, $conversation->status);
        $this->assertSame([], $this->dispatched);
    }

    final public function testUpdateFailsForUnknownConversation(): void
    {
        $dto = new ConversationDto();
        $dto->text = 'new';
        $this->conversationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->conversationRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->update(self::user()->id, $dto);
    }

    #[DataProvider('statusTransitions')]
    final public function testUpdateStatusSavesStatus(ConversationStatusEnum $from, ConversationStatusEnum $to): void
    {
        $conversation = self::entity(ConversationFactory::make(['text' => 'text', 'status' => $from]));
        $dto = new ConversationStatusDto();
        $dto->status = $to;
        $this->conversationRepository->expects($this->once())->method('findById')->with($conversation->id)->willReturn($conversation);
        $this->conversationRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Conversation $saved): bool => $saved === $conversation && $to === $saved->status));

        $this->assertSame($conversation->id, $this->service->updateStatus($conversation->id, $dto));
        $this->assertSame('text', $conversation->text);
        $this->assertSame([], $this->dispatched);
    }

    public static function statusTransitions(): iterable
    {
        yield 'sent to read' => [ConversationStatusEnum::Sent, ConversationStatusEnum::Read];
        yield 'read to sent' => [ConversationStatusEnum::Read, ConversationStatusEnum::Sent];
        yield 'unchanged' => [ConversationStatusEnum::Read, ConversationStatusEnum::Read];
    }

    final public function testUpdateStatusFailsForUnknownConversation(): void
    {
        $dto = new ConversationStatusDto();
        $dto->status = ConversationStatusEnum::Read;
        $this->conversationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->conversationRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateStatus(self::user()->id, $dto);
    }

    final public function testDelete(): void
    {
        $conversation = self::entity(ConversationFactory::make());
        $this->conversationRepository->expects($this->once())->method('findById')->with($conversation->id)->willReturn($conversation);
        $this->conversationRepository->expects($this->once())->method('delete')->with($conversation);

        $this->assertSame($conversation->id, $this->service->delete($conversation->id));
    }

    final public function testDeleteFailsForUnknownConversation(): void
    {
        $this->conversationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->conversationRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(self::user()->id);
    }

    final public function testIndexDelegatesToRepositoryForCurrentUser(): void
    {
        $dto = new ConversationIndexDto();
        $window = self::window([self::entity(ConversationFactory::make())]);
        $this->conversationRepository->expects($this->once())
            ->method('findConversations')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $conversation = self::entity(ConversationFactory::make());
        $this->conversationRepository->expects($this->once())->method('findById')->with($conversation->id)->willReturn($conversation);

        $this->assertSame($conversation, $this->service->details($conversation->id));
    }

    final public function testDetailsFailsForUnknownConversation(): void
    {
        $this->conversationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(self::user()->id);
    }

    final public function testUpdateActivityUpdatedAtRefreshesExistingActivity(): void
    {
        $receiver = self::user();
        $activity = self::entity(ConversationActivityFactory::make(['senderUser' => $this->currentUser, 'receiverUser' => $receiver]));
        $createdAt = $activity->createdAt;
        $activity->updatedAt = new DateTimeImmutable('2020-01-01');
        $this->conversationActivityRepository->expects($this->once())
            ->method('findByUserIds')
            ->with($this->currentUser->id, $receiver->id)
            ->willReturn($activity);
        $this->userRepository->expects($this->never())->method('findById');
        $updatedAt = null;
        $this->conversationActivityRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (ConversationActivity $saved) use ($activity, &$updatedAt): void {
                self::assertSame($activity, $saved);
                $updatedAt = $saved->updatedAt;
            });

        $before = new DateTimeImmutable();
        $id = $this->service->updateActivityUpdatedAt($receiver->id);
        $after = new DateTimeImmutable();

        $this->assertSame($activity->id, $id);
        $this->assertGreaterThanOrEqual($before, $updatedAt);
        $this->assertLessThanOrEqual($after, $updatedAt);
        $this->assertSame($createdAt, $activity->createdAt);
        $this->assertSame($this->currentUser, $activity->senderUser);
        $this->assertSame($receiver, $activity->receiverUser);
    }

    final public function testUpdateActivityUpdatedAtCreatesMissingActivity(): void
    {
        $receiver = self::user();
        $this->conversationActivityRepository->expects($this->once())
            ->method('findByUserIds')
            ->with($this->currentUser->id, $receiver->id)
            ->willReturn(null);
        $this->userRepository->expects($this->once())->method('findById')->with($receiver->id)->willReturn($receiver);
        $saved = null;
        $this->conversationActivityRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (ConversationActivity $activity) use (&$saved): void {
                $saved = $activity;
                self::persist()($activity);
            });

        $id = $this->service->updateActivityUpdatedAt($receiver->id);

        $this->assertNotNull($id);
        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->senderUser);
        $this->assertSame($receiver, $saved->receiverUser);
    }

    final public function testUpdateActivityUpdatedAtFailsForUnknownReceiver(): void
    {
        $this->conversationActivityRepository->expects($this->once())->method('findByUserIds')->willReturn(null);
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->conversationActivityRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateActivityUpdatedAt(self::user()->id);
    }

    final public function testIndexActivityDelegatesToRepositoryForCurrentUser(): void
    {
        $dto = new ConversationActivityIndexDto();
        $window = self::window([self::entity(ConversationActivityFactory::make())]);
        $this->conversationActivityRepository->expects($this->once())
            ->method('findActivities')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->indexActivity($dto));
    }

    final public function testDetailsActivityReturnsActivitySentToCurrentUser(): void
    {
        $sender = self::user();
        $activity = self::entity(ConversationActivityFactory::make(['senderUser' => $sender, 'receiverUser' => $this->currentUser]));
        $this->conversationActivityRepository->expects($this->once())
            ->method('findByUserIds')
            ->with($sender->id, $this->currentUser->id)
            ->willReturn($activity);

        $this->assertSame($activity, $this->service->detailsActivity($sender->id));
    }

    final public function testDetailsActivityFailsWhenMissing(): void
    {
        $this->conversationActivityRepository->expects($this->once())->method('findByUserIds')->willReturn(null);

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Conversation activity not found.');

        $this->service->detailsActivity(self::user()->id);
    }
}
