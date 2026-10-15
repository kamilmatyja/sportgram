<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{EventDisciplineList, EventDisciplineResult, Feed, User};
use PHPUnit\Framework\TestCase;

class EventDisciplineResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $list = $this->createStub(EventDisciplineList::class);
        $feed = $this->createStub(Feed::class);
        $user = $this->createStub(User::class);
        $time = 123;
        $entity = new EventDisciplineResult($list, $feed, $user, $time);
        $this->assertInstanceOf(EventDisciplineResult::class, $entity);
        $this->assertSame($list, $entity->eventDisciplineList);
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($user, $entity->user);
        $this->assertSame($time, $entity->time);
    }
}
