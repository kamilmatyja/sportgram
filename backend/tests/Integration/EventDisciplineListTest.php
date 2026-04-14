<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\EventDisciplineDistance;
use App\Entity\EventDisciplineList;
use App\Entity\Feed;
use App\Entity\User;
use App\Enum\EventDisciplineListStatusEnum;
use PHPUnit\Framework\TestCase;

class EventDisciplineListTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $distance = $this->createMock(EventDisciplineDistance::class);
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $status = EventDisciplineListStatusEnum::Active;
        $entity = new EventDisciplineList($distance, $feed, $user, $status);
        $this->assertInstanceOf(EventDisciplineList::class, $entity);
        $this->assertSame($distance, $entity->getEventDisciplineDistance());
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($status, $entity->getStatus());
    }
}
