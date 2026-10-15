<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\EventDisciplineSubDistance;
use App\Repository\EventDisciplineSubDistanceRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineSubDistanceFactory};

class EventDisciplineSubDistanceRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineSubDistanceRepository $eventDisciplineSubDistanceRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate(
            'event_discipline_sub_distances',
            'event_discipline_distances',
            'event_disciplines',
            'events',
            'users',
        );
        $this->eventDisciplineSubDistanceRepository = $this->repository(EventDisciplineSubDistanceRepository::class);
    }

    final public function testSavePersistsEventDisciplineSubDistance(): void
    {
        $distance = EventDisciplineDistanceFactory::make(em: $this->em);
        $subDistance = EventDisciplineSubDistanceFactory::make([
            'eventDisciplineDistance' => $distance,
            'subDistance' => 500,
        ]);

        $this->eventDisciplineSubDistanceRepository->save($subDistance);
        $this->clear();

        $found = $this->eventDisciplineSubDistanceRepository->findById(self::id($subDistance));
        $this->assertSame(500, $found->subDistance);
        $this->assertTrue($found->eventDisciplineDistance->id->equals($distance->id));
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEventDisciplineSubDistance(): void
    {
        $subDistance = $this->subDistance(500);

        $subDistance->subDistance = 1000;
        $this->eventDisciplineSubDistanceRepository->save($subDistance);
        $this->clear();

        $this->assertSame(1000, $this->eventDisciplineSubDistanceRepository->findById(self::id($subDistance))->subDistance);
        $this->assertSame(1, $this->eventDisciplineSubDistanceRepository->count());
    }

    final public function testDeleteRemovesEventDisciplineSubDistance(): void
    {
        $subDistance = $this->subDistance();
        $other = $this->subDistance();
        $id = self::id($subDistance);

        $this->eventDisciplineSubDistanceRepository->delete($subDistance);
        $this->clear();

        $this->assertNull($this->eventDisciplineSubDistanceRepository->find($id));
        $this->assertNotNull($this->eventDisciplineSubDistanceRepository->find(self::id($other)));
    }

    final public function testFindByIdReturnsEventDisciplineSubDistance(): void
    {
        $subDistance = $this->subDistance(700);
        $this->subDistance();
        $this->clear();

        $found = $this->eventDisciplineSubDistanceRepository->findById(self::id($subDistance));

        $this->assertSame((string) $subDistance->id, (string) $found->id);
        $this->assertSame(700, $found->subDistance);
    }

    final public function testFindByIdThrowsWhenMissing(): void
    {
        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Element not found.');

        $this->eventDisciplineSubDistanceRepository->findById(Uuid::v7());
    }

    private function subDistance(?int $value = null): EventDisciplineSubDistance
    {
        return EventDisciplineSubDistanceFactory::make(array_filter(['subDistance' => $value]), $this->em);
    }
}
