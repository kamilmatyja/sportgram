<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\{Goal, GoalParticipant, User};
use App\Enum\SaveStatusEnum;
use App\Repository\GoalParticipantRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalFactory, GoalParticipantFactory, UserFactory};

class GoalParticipantRepositoryTest extends RepositoryTestCase
{
    private GoalParticipantRepository $goalParticipantRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participants', 'goals', 'feeds', 'users');
        $this->goalParticipantRepository = $this->repository(GoalParticipantRepository::class);
    }

    final public function testSavePersistsGoalParticipant(): void
    {
        $goal = $this->goal();
        $user = $this->user();
        $participant = GoalParticipantFactory::make(['goal' => $goal, 'user' => $user, 'status' => SaveStatusEnum::Pending]);

        $this->goalParticipantRepository->save($participant);
        $this->clear();

        $found = $this->goalParticipantRepository->findById(self::id($participant));
        $this->assertTrue($found->goal->id->equals($goal->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame(SaveStatusEnum::Pending, $found->status);
        $this->assertNotNull($found->createdAt);
    }

    final public function testSaveUpdatesExistingGoalParticipant(): void
    {
        $participant = $this->participant(status: SaveStatusEnum::Pending);

        $participant->status = SaveStatusEnum::Accepted;
        $this->goalParticipantRepository->save($participant);
        $this->clear();

        $this->assertSame(SaveStatusEnum::Accepted, $this->goalParticipantRepository->findById(self::id($participant))->status);
        $this->assertSame(1, $this->goalParticipantRepository->count());
    }

    final public function testDeleteRemovesGoalParticipant(): void
    {
        $participant = $this->participant();
        $other = $this->participant();
        $id = self::id($participant);

        $this->goalParticipantRepository->delete($participant);
        $this->clear();

        $this->assertNull($this->goalParticipantRepository->find($id));
        $this->assertNotNull($this->goalParticipantRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsGoalParticipant(): void
    {
        $participant = $this->participant();
        $this->participant();
        $this->clear();

        $this->assertSame((string) $participant->id, (string) $this->goalParticipantRepository->findById(self::id($participant))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->goalParticipantRepository->findById(Uuid::v7());
    }

    final public function testFindByUserIdReturnsParticipantOfGoal(): void
    {
        $goal = $this->goal();
        $user = $this->user();
        $participant = $this->participant($goal, $user);
        $this->participant($goal, $this->user());
        $this->participant($this->goal(), $user);
        $this->clear();

        $found = $this->goalParticipantRepository->findByUserId(self::id($goal), self::id($user));

        $this->assertSame((string) $participant->id, (string) $found?->id);
    }

    final public function testFindByUserIdReturnsNullWhenUserParticipatesInOtherGoal(): void
    {
        $user = $this->user();
        $this->participant($this->goal(), $user);

        $this->assertNull($this->goalParticipantRepository->findByUserId(self::id($this->goal()), self::id($user)));
    }

    final public function testFindByUserIdReturnsNullWhenOnlyOtherUsersParticipate(): void
    {
        $goal = $this->goal();
        $this->participant($goal, $this->user());

        $this->assertNull($this->goalParticipantRepository->findByUserId(self::id($goal), self::id($this->user())));
    }

    final public function testFindByUserIdReturnsNullForGoalCreatorWhoIsNotParticipant(): void
    {
        $user = $this->user();
        $goal = $this->goal($user);

        $this->assertNull($this->goalParticipantRepository->findByUserId(self::id($goal), self::id($user)));
    }

    private function user(): User
    {
        return UserFactory::make(em: $this->em);
    }

    private function goal(?User $user = null): Goal
    {
        return GoalFactory::make(['user' => $user ?? $this->user()], $this->em);
    }

    private function participant(?Goal $goal = null, ?User $user = null, ?SaveStatusEnum $status = null): GoalParticipant
    {
        return GoalParticipantFactory::make(array_filter([
            'goal' => $goal ?? $this->goal(),
            'user' => $user ?? $this->user(),
            'status' => $status,
        ]), $this->em);
    }
}
