<?php

declare(strict_types=1);

namespace Tests\Unit\Security\Voter;

use App\Entity\{Goal, User};
use App\Enum\RoleEnum;
use App\Repository\GoalRepository;
use App\Security\Voter\GoalVoter;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\GoalFactory;

class GoalVoterTest extends VoterTestCase
{
    private GoalRepository&MockObject $goalRepository;

    private GoalVoter $voter;

    protected function setUp(): void
    {
        $this->goalRepository = $this->createMock(GoalRepository::class);
        $this->voter = new GoalVoter($this->goalRepository);
    }

    #[DataProvider('roleProvider')]
    final public function testGrantsGoalAuthor(RoleEnum $role): void
    {
        $owner = self::user($role);
        $goal = $this->goalOwnedBy($owner);
        $this->givenGoal($goal);

        $this->assertGranted($this->voter, $owner, self::idOf($goal), GoalVoter::GOAL);
    }

    public static function roleProvider(): iterable
    {
        yield 'participant' => [RoleEnum::Participant];
        yield 'organizer' => [RoleEnum::Organizer];
    }

    final public function testGrantsOwnerWithFreshlyLoadedUserInstance(): void
    {
        $owner = self::user(RoleEnum::Participant);
        $goal = $this->goalOwnedBy($owner);
        $this->givenGoal($goal);

        $sameUser = self::user(RoleEnum::Participant);
        $sameUser->id = self::idOf($owner);

        $this->assertGranted($this->voter, $sameUser, self::idOf($goal), GoalVoter::GOAL);
    }

    final public function testDeniesOtherUser(): void
    {
        $goal = $this->goalOwnedBy(self::user(RoleEnum::Participant));
        $this->givenGoal($goal);

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), self::idOf($goal), GoalVoter::GOAL);
    }

    final public function testGrantsAdministratorWithoutLookup(): void
    {
        $this->goalRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), Uuid::v4(), GoalVoter::GOAL);
    }

    final public function testAdministratorIsGrantedEvenForInvalidSubject(): void
    {
        $this->goalRepository->expects($this->never())->method('findById');

        $this->assertGranted($this->voter, self::admin(), 'not-a-uuid', GoalVoter::GOAL);
    }

    #[DataProvider('invalidSubjectProvider')]
    final public function testDeniesSubjectOtherThanUuid(mixed $subject): void
    {
        $this->goalRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, self::user(RoleEnum::Participant), $subject, GoalVoter::GOAL);
    }

    public static function invalidSubjectProvider(): iterable
    {
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
        yield 'object' => [new stdClass()];
    }

    final public function testDeniesAnonymousUser(): void
    {
        $this->goalRepository->expects($this->never())->method('findById');

        $this->assertDenied($this->voter, null, Uuid::v4(), GoalVoter::GOAL);
    }

    #[AllowMockObjectsWithoutExpectations]
    final public function testAbstainsOnOtherAttributeOrMissingSubject(): void
    {
        $this->assertAbstains($this->voter, self::admin(), Uuid::v4(), 'OTHER');
        $this->assertAbstains($this->voter, self::admin(), null, GoalVoter::GOAL);
    }

    final public function testPropagatesMissingGoal(): void
    {
        $this->goalRepository->expects($this->once())
            ->method('findById')
            ->willThrowException(new NotFoundHttpException('Element not found.'));

        $this->expectException(NotFoundHttpException::class);

        $this->voter->vote(self::token(self::user(RoleEnum::Participant)), Uuid::v4(), [GoalVoter::GOAL]);
    }

    private function goalOwnedBy(User $owner): Goal
    {
        $goal = GoalFactory::make(['user' => $owner]);
        $goal->id = Uuid::v4();

        return $goal;
    }

    private function givenGoal(Goal $goal): void
    {
        $this->goalRepository->expects($this->once())
            ->method('findById')
            ->with($this->callback(static fn (Uuid $id): bool => $id->equals($goal->id)))
            ->willReturn($goal);
    }
}
