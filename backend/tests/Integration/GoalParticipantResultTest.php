<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Feed;
use App\Entity\GoalParticipant;
use App\Entity\GoalParticipantResult;
use App\Enum\ParticipantStatusEnum;
use PHPUnit\Framework\TestCase;

class GoalParticipantResultTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $goalParticipant = $this->createMock(GoalParticipant::class);
        $feed = $this->createMock(Feed::class);
        $status = ParticipantStatusEnum::Pending;
        $entity = new GoalParticipantResult($goalParticipant, $feed, $status);
        $this->assertInstanceOf(GoalParticipantResult::class, $entity);
        $this->assertSame($goalParticipant, $entity->getGoalParticipant());
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($status, $entity->getStatus());
    }
}
