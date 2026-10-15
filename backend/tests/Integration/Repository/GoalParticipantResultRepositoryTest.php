<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\GoalParticipantResult;
use App\Enum\SaveStatusEnum;
use App\Repository\GoalParticipantResultRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FeedFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalParticipantResultRepositoryTest extends RepositoryTestCase
{
    private GoalParticipantResultRepository $goalParticipantResultRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participant_results', 'goal_participants', 'goals', 'feeds', 'users');
        $this->goalParticipantResultRepository = $this->repository(GoalParticipantResultRepository::class);
    }

    final public function testSavePersistsGoalParticipantResult(): void
    {
        $participant = GoalParticipantFactory::make(em: $this->em);
        $feed = FeedFactory::make(em: $this->em);
        $goalParticipantResult = GoalParticipantResultFactory::make([
            'goalParticipant' => $participant,
            'feed' => $feed,
            'distance' => 1500,
            'time' => 420,
            'status' => SaveStatusEnum::Pending,
        ]);

        $this->goalParticipantResultRepository->save($goalParticipantResult);
        $this->clear();

        $found = $this->goalParticipantResultRepository->findById(self::id($goalParticipantResult));
        $this->assertTrue($found->goalParticipant->id->equals($participant->id));
        $this->assertTrue($found->feed->id->equals($feed->id));
        $this->assertSame(1500, $found->distance);
        $this->assertSame(420, $found->time);
        $this->assertSame(SaveStatusEnum::Pending, $found->status);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingGoalParticipantResult(): void
    {
        $goalParticipantResult = $this->goalParticipantResult();

        $goalParticipantResult->distance = 3000;
        $goalParticipantResult->time = 900;
        $goalParticipantResult->status = SaveStatusEnum::Accepted;
        $this->goalParticipantResultRepository->save($goalParticipantResult);
        $this->clear();

        $found = $this->goalParticipantResultRepository->findById(self::id($goalParticipantResult));
        $this->assertSame(3000, $found->distance);
        $this->assertSame(900, $found->time);
        $this->assertSame(SaveStatusEnum::Accepted, $found->status);
    }

    final public function testDeleteRemovesGoalParticipantResult(): void
    {
        $goalParticipantResult = $this->goalParticipantResult();
        $id = self::id($goalParticipantResult);

        $this->goalParticipantResultRepository->delete($goalParticipantResult);
        $this->clear();

        $this->assertNull($this->goalParticipantResultRepository->find($id));
    }

    final public function testFindByIdReturnsMatchingRow(): void
    {
        $goalParticipantResult = $this->goalParticipantResult();
        $this->goalParticipantResult();
        $this->clear();

        $found = $this->goalParticipantResultRepository->findById(self::id($goalParticipantResult));

        $this->assertSame((string) $goalParticipantResult->id, (string) $found->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->goalParticipantResult();

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->goalParticipantResultRepository->findById(Uuid::v7());
    }

    private function goalParticipantResult(): GoalParticipantResult
    {
        return GoalParticipantResultFactory::make(['status' => SaveStatusEnum::Pending], $this->em);
    }
}
