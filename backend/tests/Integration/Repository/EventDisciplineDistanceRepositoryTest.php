<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\EventDisciplineDistance;
use App\Repository\EventDisciplineDistanceRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory};

class EventDisciplineDistanceRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineDistanceRepository $eventDisciplineDistanceRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_distances', 'event_disciplines', 'events', 'feeds', 'users');
        $this->eventDisciplineDistanceRepository = $this->repository(EventDisciplineDistanceRepository::class);
    }

    final public function testSavePersistsEventDisciplineDistance(): void
    {
        $eventDiscipline = EventDisciplineFactory::make(em: $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $eventDiscipline, 'distance' => 21097]);

        $this->eventDisciplineDistanceRepository->save($distance);
        $this->clear();

        $found = $this->eventDisciplineDistanceRepository->findById(self::id($distance));
        $this->assertTrue($found->eventDiscipline->id->equals($eventDiscipline->id));
        $this->assertSame(21097, $found->distance);
        $this->assertNotNull($found->createdAt);
        $this->assertCount(0, $found->subDistances);
        $this->assertCount(0, $found->lists);
    }

    final public function testSaveUpdatesExistingEventDisciplineDistance(): void
    {
        $distance = $this->distance(5000);

        $distance->distance = 10000;
        $this->eventDisciplineDistanceRepository->save($distance);
        $this->clear();

        $this->assertSame(10000, $this->eventDisciplineDistanceRepository->findById(self::id($distance))->distance);
        $this->assertSame(1, $this->eventDisciplineDistanceRepository->count());
    }

    final public function testDeleteRemovesEventDisciplineDistance(): void
    {
        $distance = $this->distance();
        $other = $this->distance();
        $id = self::id($distance);

        $this->eventDisciplineDistanceRepository->delete($distance);
        $this->clear();

        $this->assertNull($this->eventDisciplineDistanceRepository->find($id));
        $this->assertNotNull($this->eventDisciplineDistanceRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsEventDisciplineDistance(): void
    {
        $distance = $this->distance();
        $this->distance();
        $this->clear();

        $this->assertSame((string) $distance->id, (string) $this->eventDisciplineDistanceRepository->findById(self::id($distance))->id);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->eventDisciplineDistanceRepository->findById(Uuid::v4());
    }

    private function distance(?int $distance = null): EventDisciplineDistance
    {
        return EventDisciplineDistanceFactory::make(array_filter(['distance' => $distance]), $this->em);
    }
}
