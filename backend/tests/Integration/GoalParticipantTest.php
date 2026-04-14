<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Goal;
use App\Entity\GoalParticipant;
use App\Entity\User;
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
        $this->assertSame($goal, $entity->getGoal());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($status, $entity->getStatus());
    }
}

