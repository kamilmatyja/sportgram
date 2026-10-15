<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Friend, User};
use App\Enum\RoleEnum;
use App\Repository\FriendRepository;
use App\Security\Voter\FriendVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendVoterTest extends VoterTestCase
{
    private FriendRepository&MockObject $friendRepository;

    private FriendVoter $voter;

    protected function setUp(): void
    {
        $this->friendRepository = $this->createMock(FriendRepository::class);
        $this->voter = new FriendVoter($this->friendRepository);
    }

    final public function testGrantsSender(): void
    {
        $sender = self::user(RoleEnum::Participant);
        $friend = $this->friendBetween($sender, self::user(RoleEnum::Participant));
        $this->givenFriend($friend);

        $this->assertGranted($this->voter, self::reloaded($sender), self::idOf($friend), FriendVoter::FRIEND);
    }

    final public function testGrantsReceiver(): void
    {
        $receiver = self::user(RoleEnum::Participant);
        $friend = $this->friendBetween(self::user(RoleEnum::Participant), $receiver);
        $this->givenFriend($friend);

        $this->assertGranted($this->voter, self::reloaded($receiver), self::idOf($friend), FriendVoter::FRIEND);
    }

    final public function testDeniesUserOutsideFriendship(): void
    {
        $friend = $this->friendBetween(self::user(RoleEnum::Participant), self::user(RoleEnum::Participant));
        $this->givenFriend($friend);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($friend), FriendVoter::FRIEND);
    }

    final public function testDeniesAdministratorOutsideFriendship(): void
    {
        $friend = $this->friendBetween(self::user(RoleEnum::Participant), self::user(RoleEnum::Participant));
        $this->givenFriend($friend);

        $this->assertDenied($this->voter, self::admin(), self::idOf($friend), FriendVoter::FRIEND);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->friendRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, FriendVoter::FRIEND);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->friendRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v7(), FriendVoter::FRIEND);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v7(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, FriendVoter::FRIEND);
    }

    final public function testPropagatesMissingFriend(): void
    {
        $this->friendRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v7(), [FriendVoter::FRIEND]);
    }

    private function friendBetween(User $sender, User $receiver): Friend
    {
        $friend = FriendFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver]);
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
