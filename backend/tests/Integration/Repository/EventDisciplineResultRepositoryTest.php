<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\EventDisciplineResult;
use App\Repository\EventDisciplineResultRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineListFactory, EventDisciplineResultFactory, FeedFactory, UserFactory};

class EventDisciplineResultRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineResultRepository $eventDisciplineResultRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate(
            'event_discipline_results',
            'event_discipline_lists',
            'event_discipline_distances',
            'event_disciplines',
            'events',
            'pages',
            'feeds',
            'users',
        );
        $this->eventDisciplineResultRepository = $this->repository(EventDisciplineResultRepository::class);
    }

    final public function testSavePersistsEventDisciplineResult(): void
    {
        $list = EventDisciplineListFactory::make(em: $this->em);
        $feed = FeedFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $eventDisciplineResult = EventDisciplineResultFactory::make([
            'eventDisciplineList' => $list,
            'feed' => $feed,
            'user' => $user,
            'time' => 3725,
        ]);

        $this->eventDisciplineResultRepository->save($eventDisciplineResult);
        $this->clear();

        $found = $this->eventDisciplineResultRepository->findById(self::id($eventDisciplineResult));
        $this->assertTrue($found->eventDisciplineList->id->equals($list->id));
        $this->assertTrue($found->feed->id->equals($feed->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertSame(3725, $found->time);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEventDisciplineResult(): void
    {
        $eventDisciplineResult = $this->eventDisciplineResult(100);

        $eventDisciplineResult->time = 200;
        $this->eventDisciplineResultRepository->save($eventDisciplineResult);
        $this->clear();

        $this->assertSame(200, $this->eventDisciplineResultRepository->findById(self::id($eventDisciplineResult))->time);
    }

    final public function testDeleteRemovesEventDisciplineResult(): void
    {
        $eventDisciplineResult = $this->eventDisciplineResult();
        $id = self::id($eventDisciplineResult);

        $this->eventDisciplineResultRepository->delete($eventDisciplineResult);
        $this->clear();

        $this->assertNull($this->eventDisciplineResultRepository->find($id));
    }

    final public function testFindByIdReturnsMatchingRow(): void
    {
        $eventDisciplineResult = $this->eventDisciplineResult();
        $this->eventDisciplineResult();
        $this->clear();

        $found = $this->eventDisciplineResultRepository->findById(self::id($eventDisciplineResult));

        $this->assertSame((string) $eventDisciplineResult->id, (string) $found->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->eventDisciplineResult();

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->eventDisciplineResultRepository->findById(Uuid::v7());
    }

    private function eventDisciplineResult(int $time = 60): EventDisciplineResult
    {
        return EventDisciplineResultFactory::make(['time' => $time], $this->em);
    }
}
