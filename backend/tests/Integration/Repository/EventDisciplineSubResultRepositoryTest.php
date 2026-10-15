<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\EventDisciplineSubResult;
use App\Repository\EventDisciplineSubResultRepository;
use Tests\Factory\{EventDisciplineResultFactory, EventDisciplineSubDistanceFactory, EventDisciplineSubResultFactory, UserFactory};

class EventDisciplineSubResultRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineSubResultRepository $eventDisciplineSubResultRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate(
            'event_discipline_sub_results',
            'event_discipline_results',
            'event_discipline_sub_distances',
            'event_discipline_lists',
            'event_discipline_distances',
            'event_disciplines',
            'events',
            'feeds',
            'users',
        );
        $this->eventDisciplineSubResultRepository = $this->repository(EventDisciplineSubResultRepository::class);
    }

    final public function testSavePersistsEventDisciplineSubResult(): void
    {
        $subDistance = EventDisciplineSubDistanceFactory::make(em: $this->em);
        $result = EventDisciplineResultFactory::make(em: $this->em);
        $user = UserFactory::make(em: $this->em);
        $subResult = EventDisciplineSubResultFactory::make([
            'eventDisciplineSubDistance' => $subDistance,
            'eventDisciplineResult' => $result,
            'user' => $user,
            'time' => 1234,
        ]);

        $this->eventDisciplineSubResultRepository->save($subResult);
        $this->clear();

        $found = $this->eventDisciplineSubResultRepository->find(self::id($subResult));
        $this->assertInstanceOf(EventDisciplineSubResult::class, $found);
        $this->assertSame(1234, $found->time);
        $this->assertTrue($found->eventDisciplineSubDistance->id->equals($subDistance->id));
        $this->assertTrue($found->eventDisciplineResult->id->equals($result->id));
        $this->assertTrue($found->user->id->equals($user->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEventDisciplineSubResult(): void
    {
        $subResult = $this->subResult(1234);

        $subResult->time = 999;
        $this->eventDisciplineSubResultRepository->save($subResult);
        $this->clear();

        $this->assertSame(999, $this->eventDisciplineSubResultRepository->find(self::id($subResult))->time);
        $this->assertSame(1, $this->eventDisciplineSubResultRepository->count());
    }

    final public function testDeleteRemovesEventDisciplineSubResult(): void
    {
        $subResult = $this->subResult();
        $other = $this->subResult();
        $id = self::id($subResult);

        $this->eventDisciplineSubResultRepository->delete($subResult);
        $this->clear();

        $this->assertNull($this->eventDisciplineSubResultRepository->find($id));
        $this->assertNotNull($this->eventDisciplineSubResultRepository->find(self::id($other)));
    }

    private function subResult(?int $time = null): EventDisciplineSubResult
    {
        return EventDisciplineSubResultFactory::make(array_filter(['time' => $time]), $this->em);
    }
}
