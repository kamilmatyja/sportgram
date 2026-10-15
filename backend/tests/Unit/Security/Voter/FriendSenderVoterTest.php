<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Friend, User};
use App\Enum\RoleEnum;
use App\Repository\FriendRepository;
use App\Security\Voter\FriendSenderVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendSenderVoterTest extends VoterTestCase
{
    private FriendRepository&MockObject $friendRepository;

    private FriendSenderVoter $voter;

    protected function setUp(): void
    {
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->voter = new FriendSenderVoter($this->friendRepository);
    }

    final public function testGrantsSender(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $friend = $this->friendOwnedBy($owner);
        $this->givenFriend($friend);

        $this->assertGranted($this->voter, $owner, self::idOf($friend), FriendSenderVoter::FRIEND_SENDER);
    }

    final public function testDeniesOtherUser(): void
    {
        $friend = $this->friendOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFriend($friend);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($friend), FriendSenderVoter::FRIEND_SENDER);
    }

    final public function testDeniesReceiver(): void
    {
        $receiver = self::user(RoleEnum::Participant);
        $friend = FriendFactory::make(['senderUser' => self::user(RoleEnum::Participant), 'receiverUser' => $receiver]);
        $friend->id = Uuid::v7();
        $this->givenFriend($friend);

        $this->assertDenied($this->voter, $receiver, self::idOf($friend), FriendSenderVoter::FRIEND_SENDER);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $friend = $this->friendOwnedBy(self::user(RoleEnum::Participant));
        $this->givenFriend($friend);

        $this->assertDenied($this->voter, self::admin(), self::idOf($friend), FriendSenderVoter::FRIEND_SENDER);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->friendRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, FriendSenderVoter::FRIEND_SENDER);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->friendRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', FriendSenderVoter::FRIEND_SENDER);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->friendRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), FriendSenderVoter::FRIEND_SENDER);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, FriendSenderVoter::FRIEND_SENDER);
    }

    final public function testPropagatesMissingFriend(): void
    {
        $this->friendRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [FriendSenderVoter::FRIEND_SENDER]);
    }

    private function friendOwnedBy(User $owner): Friend
    {
        $friend = FriendFactory::make(['senderUser' => $owner, 'receiverUser' => self::user(RoleEnum::Participant)]);
        $friend->id = Uuid::v7();

        return $friend;
    }

    private function givenFriend(Friend $friend): void
    {
        $this->friendRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($friend->id)))
            ->willReturn($friend);
    }
}
