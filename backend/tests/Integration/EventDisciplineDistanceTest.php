<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{EventDiscipline, EventDisciplineDistance};
use PHPUnit\Framework\TestCase;

class EventDisciplineDistanceTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $eventDiscipline = $this->createMock(EventDiscipline::class);
        $distance = 1000;
        $entity = new EventDisciplineDistance($eventDiscipline, $distance);
        $this->assertInstanceOf(EventDisciplineDistance::class, $entity);
        $this->assertSame($eventDiscipline, $entity->eventDiscipline);
        $this->assertSame($distance, $entity->distance);
    }
}
