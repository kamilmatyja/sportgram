<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Goal, GoalParticipant, User};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class GoalParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $goal = $this->createMock(Goal::class);
        $user = $this->createMock(User::class);
        $status = SaveStatusEnum::Pending;
        $entity = new GoalParticipant($goal, $user, $status);
        $this->assertInstanceOf(GoalParticipant::class, $entity);
        $this->assertSame($goal, $entity->goal);
        $this->assertSame($user, $entity->user);
        $this->assertSame($status, $entity->status);
    }
}
