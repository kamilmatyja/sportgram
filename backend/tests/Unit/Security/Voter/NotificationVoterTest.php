<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Notification, User};
use App\Enum\RoleEnum;
use App\Repository\NotificationRepository;
use App\Security\Voter\NotificationVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

class NotificationVoterTest extends VoterTestCase
{
    private NotificationRepository&MockObject $notificationRepository;

    private NotificationVoter $voter;

    protected function setUp(): void
    {
        $this->notificationRepository = $this->createMock(NotificationRepository::class);
        $this->voter = new NotificationVoter($this->notificationRepository);
    }

    final public function testGrantsRecipient(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $notification = $this->notificationOwnedBy($owner);
        $this->givenNotification($notification);

        $this->assertGranted($this->voter, $owner, self::idOf($notification), NotificationVoter::NOTIFICATION);
    }

    final public function testDeniesOtherUser(): void
    {
        $notification = $this->notificationOwnedBy(self::user(RoleEnum::Participant));
        $this->givenNotification($notification);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($notification), NotificationVoter::NOTIFICATION);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $notification = $this->notificationOwnedBy(self::user(RoleEnum::Participant));
        $this->givenNotification($notification);

        $this->assertDenied($this->voter, self::admin(), self::idOf($notification), NotificationVoter::NOTIFICATION);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->notificationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, NotificationVoter::NOTIFICATION);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->notificationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', NotificationVoter::NOTIFICATION);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->notificationRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), NotificationVoter::NOTIFICATION);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, NotificationVoter::NOTIFICATION);
    }

    final public function testPropagatesMissingNotification(): void
    {
        $this->notificationRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [NotificationVoter::NOTIFICATION]);
    }

    private function notificationOwnedBy(User $owner): Notification
    {
        $notification = NotificationFactory::make(['user' => $owner]);
        $notification->id = Uuid::v4();

        return $notification;
    }

    private function givenNotification(Notification $notification): void
    {
        $this->notificationRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($notification->id)))
            ->willReturn($notification);
    }
}
