<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{NotificationIndexDto, NotificationStatusDto};
use App\Entity\{Notification, User};
use App\Enum\NotificationStatusEnum;
use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

#[AllowMockObjectsWithoutExpectations]
class NotificationServiceTest extends ServiceTestCase
{
    private NotificationRepository&MockObject $notificationRepository;

    private User $currentUser;

    private NotificationService $service;

    protected function setUp(): void
    {
        $this->notificationRepository = $this->createMock(NotificationRepository::class);
        $this->currentUser = self::user();

        $this->service = new NotificationService(
            $this->notificationRepository,
            $this->security($this->currentUser),
        );
    }

    public static function statusProvider(): iterable
    {
        foreach (NotificationStatusEnum::cases() as $status) {
            yield $status->name => [$status];
        }
    }

    #[DataProvider('statusProvider')]
    final public function testUpdateStatusSavesStatus(NotificationStatusEnum $status): void
    {
        $notification = self::entity(NotificationFactory::make(['status' => NotificationStatusEnum::NotSent]));
        $dto = new NotificationStatusDto();
        $dto->status = $status;
        $this->notificationRepository->expects($this->once())
            ->method('findById')
            ->with($notification->id)
            ->willReturn($notification);
        $this->notificationRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (Notification $saved): bool => $saved === $notification && $status === $saved->status));

        $this->assertSame($notification->id, $this->service->updateStatus($notification->id, $dto));
    }

    final public function testUpdateStatusFailsForUnknownNotification(): void
    {
        $dto = new NotificationStatusDto();
        $dto->status = NotificationStatusEnum::Read;
        $this->notificationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->notificationRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->updateStatus(Uuid::v4(), $dto);
    }

    final public function testDelete(): void
    {
        $notification = self::entity(NotificationFactory::make());
        $this->notificationRepository->expects($this->once())
            ->method('findById')
            ->with($notification->id)
            ->willReturn($notification);
        $this->notificationRepository->expects($this->once())->method('delete')->with($notification);

        $this->assertSame($notification->id, $this->service->delete($notification->id));
    }

    final public function testDeleteFailsForUnknownNotification(): void
    {
        $this->notificationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());
        $this->notificationRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(Uuid::v4());
    }

    final public function testIndexDelegatesToRepositoryWithCurrentUser(): void
    {
        $dto = new NotificationIndexDto();
        $window = self::window([self::entity(NotificationFactory::make(['user' => $this->currentUser]))]);
        $this->notificationRepository->expects($this->once())
            ->method('findNotifications')
            ->with($this->currentUser->id, $dto)
            ->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $notification = self::entity(NotificationFactory::make());
        $this->notificationRepository->expects($this->once())
            ->method('findById')
            ->with($notification->id)
            ->willReturn($notification);

        $this->assertSame($notification, $this->service->details($notification->id));
    }

    final public function testDetailsFailsForUnknownNotification(): void
    {
        $this->notificationRepository->expects($this->once())->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(Uuid::v4());
    }
}
