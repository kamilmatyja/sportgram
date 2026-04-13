<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Goal;
use App\Entity\GoalParticipant;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class GoalParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $goal = $this->createMock(Goal::class);
        $user = $this->createMock(User::class);
        $entity = new GoalParticipant($goal, $user);
        $this->assertInstanceOf(GoalParticipant::class, $entity);
        $this->assertSame($goal, $entity->getGoal());
        $this->assertSame($user, $entity->getUser());
    }
}

