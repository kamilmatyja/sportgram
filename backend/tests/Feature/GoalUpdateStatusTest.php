<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{GoalStatusEnum, RoleEnum};
use Tests\Factory\GoalFactory;

class GoalUpdateStatusTest extends ApiTestCase
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

        $goal = GoalFactory::make(['user' => $goalOwner, 'status' => GoalStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/goals/{$goal->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $goalOwner = self::createUser(RoleEnum::Participant);
        $admin = self::createUser(RoleEnum::Administrator);

        $goal = GoalFactory::make(['user' => $goalOwner, 'status' => GoalStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/goals/{$goal->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user, 'status' => GoalStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/goals/{$goal->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
