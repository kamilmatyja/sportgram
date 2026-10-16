<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{GoalParticipant, User};
use App\Enum\RoleEnum;
use App\Repository\GoalParticipantRepository;
use App\Security\Voter\GoalParticipantVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\GoalParticipantFactory;

class GoalParticipantVoterTest extends VoterTestCase
{
    private GoalParticipantRepository&MockObject $goalParticipantRepository;

    private GoalParticipantVoter $voter;

    protected function setUp(): void
    {
        $this->goalParticipantRepository = $this->createMock(GoalParticipantRepository::class);
        $this->voter = new GoalParticipantVoter($this->goalParticipantRepository);
    }

    final public function testGrantsGoalParticipantUser(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $goalParticipant = $this->goalParticipantOwnedBy($owner);
        $this->givenGoalParticipant($goalParticipant);

        $this->assertGranted($this->voter, self::reloaded($owner), self::idOf($goalParticipant), GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    final public function testDeniesOtherUser(): void
    {
        $goalParticipant = $this->goalParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenGoalParticipant($goalParticipant);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($goalParticipant), GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    final public function testDeniesAdministratorWhoIsNotTheOwner(): void
    {
        $goalParticipant = $this->goalParticipantOwnedBy(self::user(RoleEnum::Participant));
        $this->givenGoalParticipant($goalParticipant);

        $this->assertDenied($this->voter, self::admin(), self::idOf($goalParticipant), GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->goalParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->goalParticipantRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, GoalParticipantVoter::GOAL_PARTICIPANT);
    }

    final public function testPropagatesMissingGoalParticipant(): void
    {
        $this->goalParticipantRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [GoalParticipantVoter::GOAL_PARTICIPANT]);
    }

    private function goalParticipantOwnedBy(User $owner): GoalParticipant
    {
        $goalParticipant = GoalParticipantFactory::make(['user' => $owner]);
        $goalParticipant->id = Uuid::v4();

        return $goalParticipant;
    }

    private function givenGoalParticipant(GoalParticipant $goalParticipant): void
    {
        $this->goalParticipantRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($goalParticipant->id)))
            ->willReturn($goalParticipant);
    }
}
