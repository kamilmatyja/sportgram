<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{GoalFactory, GoalParticipantFactory};

class GoalDeleteTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participant_results');
        $this->truncate('goal_participants');
        $this->truncate('goals');
        $this->truncate('feeds');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $goalOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $goal = GoalFactory::make(['user' => $goalOwner], $this->em);

        $result = $this->delete("/api/goals/{$goal->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testCannotDeleteGoalWithParticipants(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user], $this->em);

        GoalParticipantFactory::make(['goal' => $goal, 'user' => $user], $this->em);

        $result = $this->delete("/api/goals/{$goal->id->toString()}", $user);

        $this->assertEquals(409, $result['status']);
        $this->assertEquals('Cannot delete goal with participants.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user], $this->em);

        $result = $this->delete("/api/goals/{$goal->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
