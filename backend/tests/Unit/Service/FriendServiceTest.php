<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{FriendDto, FriendIndexDto, FriendStatusDto};
use App\Entity\{Friend, User};
use App\Enum\{FriendStatusEnum, NotificationTypeEnum};
use App\Repository\{FriendRepository, UserRepository};
use App\Service\FriendService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{FriendFactory, UserFactory};

#[AllowMockObjectsWithoutExpectations]
class FriendServiceTest extends ServiceTestCase
{
    private FriendRepository&MockObject $friendRepository;

    private UserRepository&MockObject $userRepository;

    private User $currentUser;

    private FriendService $service;

    protected function setUp(): void
    {
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->currentUser = self::entity(UserFactory::make(['firstName' => 'Jan', 'lastName' => 'Kowalski', 'link' => 'jan']));

        $this->service = new FriendService(
            $this->friendRepository,
            $this->userRepository,
            $this->dispatcher(),
            $this->security($this->currentUser),
        );
    }

    final public function testCreateSavesPendingFriendshipAndNotifiesReceiver(): void
    {
        $receiver = self::user();
        $dto = new FriendDto();
        $dto->userId = $receiver->id;
        $this->userRepository->expects($this->once())->method('findById')->with($receiver->id)->willReturn($receiver);
        $this->friendRepository->expects($this->once())
            ->method('hasRow')
            ->with($this->currentUser->id, $receiver->id)
            ->willReturn(false);
        $saved = null;
        $this->friendRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (Friend $friend) use (&$saved): void {
                $saved = $friend;
                self::persist()($friend);
            });

        $id = $this->service->create($dto);

        $this->assertSame($saved->id, $id);
        $this->assertSame($this->currentUser, $saved->senderUser);
        $this->assertSame($receiver, $saved->receiverUser);
        $this->assertSame(FriendStatusEnum::Pending, $saved->status);
        $this->assertNotifications([[$receiver, NotificationTypeEnum::Friend, 'Jan Kowalski', '/users/jan']]);
    }

    final public function testCreateRejectsExistingRelationship(): void
    {
        $receiver = self::user();
        $dto = new FriendDto();
        $dto->userId = $receiver->id;
        $this->userRepository->expects($this->once())->method('findById')->willReturn($receiver);
        $this->friendRepository->expects($this->once())->method('hasRow')->willReturn(true);
        $this->friendRepository->expects($this->never())->method('save');

        try {
            $this->service->create($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('User already has friend relationship with this user.', $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testCreateFailsForUnknownReceiver(): void
    {
        $dto = new FriendDto();
        $dto->userId = self::user()->id;
        $this->userRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->friendRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->create($dto);
    }

    final public function testUpdateStatusSavesStatusAndNotifiesBothSides(): void
    {
        $sender = self::entity(UserFactory::make(['firstName' => 'Anna', 'lastName' => 'Nowak', 'link' => 'anna']));
        $receiver = self::entity(UserFactory::make(['firstName' => 'Piotr', 'lastName' => 'Lis', 'link' => 'piotr']));
        $friend = self::entity(FriendFactory::make([
            'senderUser' => $sender,
            'receiverUser' => $receiver,
            'status' => FriendStatusEnum::Pending,
        ]));
        $dto = new FriendStatusDto();
        $dto->status = FriendStatusEnum::Accepted;
        $this->friendRepository->expects($this->once())->method('findById')->with($friend->id)->willReturn($friend);
        $this->friendRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Friend $saved): bool => $saved === $friend && FriendStatusEnum::Accepted === $saved->status));

        $this->assertSame($friend->id, $this->service->updateStatus($friend->id, $dto));
        $this->assertNotifications([
            [$sender, NotificationTypeEnum::FriendStatus, 'Piotr Lis', '/users/piotr'],
            [$receiver, NotificationTypeEnum::FriendStatus, 'Anna Nowak', '/users/anna'],
        ]);
    }

    final public function testDelete(): void
    {
        $friend = self::entity(FriendFactory::make());
        $this->friendRepository->expects($this->once())->method('findById')->with($friend->id)->willReturn($friend);
        $this->friendRepository->expects($this->once())->method('delete')->with($friend);

        $this->assertSame($friend->id, $this->service->delete($friend->id));
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new FriendIndexDto();
        $window = self::window([self::entity(FriendFactory::make())]);
        $this->friendRepository->expects($this->once())->method('findFriends')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $friend = self::entity(FriendFactory::make());
        $this->friendRepository->expects($this->once())->method('findById')->with($friend->id)->willReturn($friend);

        $this->assertSame($friend, $this->service->details($friend->id));
    }
}
