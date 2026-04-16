<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{EventDisciplineDistance, EventDisciplineResult, Feed, User};
use PHPUnit\Framework\TestCase;

class EventDisciplineResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $distance = $this->createMock(EventDisciplineDistance::class);
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $time = 123;
        $entity = new EventDisciplineResult($distance, $feed, $user, $time);
        $this->assertInstanceOf(EventDisciplineResult::class, $entity);
        $this->assertSame($distance, $entity->getEventDisciplineDistance());
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($time, $entity->getTime());
    }
}
