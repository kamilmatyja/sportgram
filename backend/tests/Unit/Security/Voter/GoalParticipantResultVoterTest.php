<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{GoalParticipantResult, User};
use App\Enum\RoleEnum;
use App\Repository\GoalParticipantResultRepository;
use App\Security\Voter\GoalParticipantResultVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalParticipantFactory, GoalParticipantResultFactory};

class GoalParticipantResultVoterTest extends VoterTestCase
{
    private GoalParticipantResultRepository&MockObject $goalParticipantResultRepository;

    private GoalParticipantResultVoter $voter;

    protected function setUp(): void
    {
        $this->goalParticipantResultRepository = $this->createMock(GoalParticipantResultRepository::class);
        $this->voter = new GoalParticipantResultVoter($this->goalParticipantResultRepository);
    }

    final public function testGrantsGoalParticipant(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $goalParticipantResult = $this->goalParticipantResultOwnedBy($owner);
        $this->givenGoalParticipantResult($goalParticipantResult);

        $this->assertGranted($this->voter, $owner, self::idOf($goalParticipantResult), GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    final public function testDeniesOtherUser(): void
    {
        $goalParticipantResult = $this->goalParticipantResultOwnedBy(self::user(RoleEnum::Participant));
        $this->givenGoalParticipantResult($goalParticipantResult);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($goalParticipantResult), GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    final public function testDeniesAdministratorWithoutOwnership(): void
    {
        $goalParticipantResult = $this->goalParticipantResultOwnedBy(self::user(RoleEnum::Participant));
        $this->givenGoalParticipantResult($goalParticipantResult);

        $this->assertDenied($this->voter, self::admin(), self::idOf($goalParticipantResult), GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->goalParticipantResultRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testDeniesAdministratorForInvalidSubject(): void
    {
        $this->goalParticipantResultRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::admin(), 'not-a-uuid', GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->goalParticipantResultRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT);
    }

    final public function testPropagatesMissingGoalParticipantResult(): void
    {
        $this->goalParticipantResultRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [GoalParticipantResultVoter::GOAL_PARTICIPANT_RESULT]);
    }

    private function goalParticipantResultOwnedBy(User $owner): GoalParticipantResult
    {
        $goalParticipantResult = GoalParticipantResultFactory::make([
            'goalParticipant' => GoalParticipantFactory::make(['user' => $owner]),
        ]);
        $goalParticipantResult->id = Uuid::v4();

        return $goalParticipantResult;
    }

    private function givenGoalParticipantResult(GoalParticipantResult $goalParticipantResult): void
    {
        $this->goalParticipantResultRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($goalParticipantResult->id)))
            ->willReturn($goalParticipantResult);
    }
}
