<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Event;
use App\Entity\EventDiscipline;
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\TestCase;

class EventDisciplineTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $event = $this->createMock(Event::class);
        $discipline = DisciplineEnum::Running;
        $entity = new EventDiscipline($event, $discipline);
        $this->assertInstanceOf(EventDiscipline::class, $entity);
        $this->assertSame($event, $entity->getEvent());
        $this->assertSame($discipline, $entity->getDiscipline());
    }
}
