<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Feed, GoalParticipant, GoalParticipantResult};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class GoalParticipantResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $goalParticipant = $this->createMock(GoalParticipant::class);
        $feed = $this->createMock(Feed::class);
        $distance = 10000;
        $time = 3600;
        $status = SaveStatusEnum::Pending;
        $entity = new GoalParticipantResult($goalParticipant, $feed, $distance, $time, $status);
        $this->assertInstanceOf(GoalParticipantResult::class, $entity);
        $this->assertSame($goalParticipant, $entity->goalParticipant);
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($status, $entity->status);
    }
}
