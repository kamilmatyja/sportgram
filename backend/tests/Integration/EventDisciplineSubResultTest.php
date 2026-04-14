<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\EventDisciplineSubDistance;
use App\Entity\EventDisciplineSubResult;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class EventDisciplineSubResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $subDistance = $this->createMock(EventDisciplineSubDistance::class);
        $user = $this->createMock(User::class);
        $time = 12;
        $entity = new EventDisciplineSubResult($subDistance, $user, $time);
        $this->assertInstanceOf(EventDisciplineSubResult::class, $entity);
        $this->assertSame($subDistance, $entity->getEventDisciplineSubDistance());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($time, $entity->getTime());
    }
}
