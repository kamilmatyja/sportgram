<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{EventDisciplineDistance, EventDisciplineSubDistance};
use PHPUnit\Framework\TestCase;

class EventDisciplineSubDistanceTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $distance = $this->createMock(EventDisciplineDistance::class);
        $subDistance = 500;
        $entity = new EventDisciplineSubDistance($distance, $subDistance);
        $this->assertInstanceOf(EventDisciplineSubDistance::class, $entity);
        $this->assertSame($distance, $entity->eventDisciplineDistance);
        $this->assertSame($subDistance, $entity->subDistance);
    }
}
