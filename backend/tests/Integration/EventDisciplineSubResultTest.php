<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{EventDisciplineResult, EventDisciplineSubDistance, EventDisciplineSubResult, User};
use PHPUnit\Framework\TestCase;

class EventDisciplineSubResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $subDistance = $this->createMock(EventDisciplineSubDistance::class);
        $result = $this->createMock(EventDisciplineResult::class);
        $user = $this->createMock(User::class);
        $time = 12;
        $entity = new EventDisciplineSubResult($subDistance, $result, $user, $time);
        $this->assertInstanceOf(EventDisciplineSubResult::class, $entity);
        $this->assertSame($subDistance, $entity->eventDisciplineSubDistance);
        $this->assertSame($result, $entity->eventDisciplineResult);
        $this->assertSame($user, $entity->user);
        $this->assertSame($time, $entity->time);
    }
}
