<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{EventDisciplineDistance, EventDisciplineList, Feed, User};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class EventDisciplineListTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $distance = $this->createStub(EventDisciplineDistance::class);
        $feed = $this->createStub(Feed::class);
        $user = $this->createStub(User::class);
        $status = SaveStatusEnum::Accepted;
        $entity = new EventDisciplineList($distance, $feed, $user, $status);
        $this->assertInstanceOf(EventDisciplineList::class, $entity);
        $this->assertSame($distance, $entity->eventDisciplineDistance);
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($user, $entity->user);
        $this->assertSame($status, $entity->status);
    }
}
