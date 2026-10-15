<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use App\Entity\EventDiscipline;
use App\Enum\DisciplineEnum;
use App\Repository\EventDisciplineRepository;
use Tests\Factory\{EventDisciplineFactory, EventFactory};

class EventDisciplineRepositoryTest extends RepositoryTestCase
{
    private EventDisciplineRepository $eventDisciplineRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_disciplines', 'events', 'pages', 'users');
        $this->eventDisciplineRepository = $this->repository(EventDisciplineRepository::class);
    }

    final public function testSavePersistsEventDiscipline(): void
    {
        $event = EventFactory::make(em: $this->em);
        $eventDiscipline = EventDisciplineFactory::make([
            'event' => $event,
            'discipline' => DisciplineEnum::Rowing,
        ]);

        $this->eventDisciplineRepository->save($eventDiscipline);
        $this->clear();

        $found = $this->eventDisciplineRepository->find(self::id($eventDiscipline));
        $this->assertInstanceOf(EventDiscipline::class, $found);
        $this->assertTrue($found->event->id->equals($event->id));
        $this->assertSame(DisciplineEnum::Rowing, $found->discipline);
        $this->assertNotNull($found->createdAt);
        $this->assertNotNull($found->updatedAt);
    }

    final public function testSaveUpdatesExistingEventDiscipline(): void
    {
        $eventDiscipline = EventDisciplineFactory::make(['discipline' => DisciplineEnum::Running], $this->em);

        $eventDiscipline->discipline = DisciplineEnum::Cycling;
        $this->eventDisciplineRepository->save($eventDiscipline);
        $this->clear();

        $this->assertSame(
            DisciplineEnum::Cycling,
            $this->eventDisciplineRepository->find(self::id($eventDiscipline))->discipline,
        );
    }

    final public function testDeleteRemovesEventDiscipline(): void
    {
        $eventDiscipline = EventDisciplineFactory::make(em: $this->em);
        $kept = EventDisciplineFactory::make(em: $this->em);
        $id = self::id($eventDiscipline);

        $this->eventDisciplineRepository->delete($eventDiscipline);
        $this->clear();

        $this->assertNull($this->eventDisciplineRepository->find($id));
        $this->assertNotNull($this->eventDisciplineRepository->find(self::id($kept)));
    }
}
