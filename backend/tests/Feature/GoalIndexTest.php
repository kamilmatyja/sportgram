<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{GoalStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalFactory, GoalParticipantFactory};

class GoalIndexTest extends ApiTestCase
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

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/goals');
        $this->assertEquals(401, $result['status']);
    }

    final public function testValidationFailedInvalidUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $userId = Uuid::v4()->toString();

        $result = $this->get("/api/goals?filter[userId]={$userId}", $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('filter.userId', $result['json']['errors']);
    }

    final public function testSuccessWithFilters(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $goal1 = GoalFactory::make(
            ['user' => $user, 'text' => 'My first goal', 'status' => GoalStatusEnum::Active],
            $this->em,
        );
        GoalParticipantFactory::make(['goal' => $goal1, 'user' => $user], $this->em);

        $goal2 = GoalFactory::make(
            ['user' => $user, 'text' => 'Another goal', 'status' => GoalStatusEnum::Draft],
            $this->em,
        );
        GoalParticipantFactory::make(['goal' => $goal2, 'user' => $user], $this->em);

        $result = $this->get(
            "/api/goals?filter[userId]={$user->id->toString()}&filter[status]=" . GoalStatusEnum::Active->value,
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']['data']);
        $this->assertEquals(1, $result['json']['pagination']['total']);
        $this->assertEquals('My first goal', $result['json']['data'][0]['text']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            $goal = GoalFactory::make(['user' => $user], $this->em);
            GoalParticipantFactory::make(['goal' => $goal, 'user' => $user], $this->em);
        }

        $result = $this->get("/api/goals?filter[userId]={$user->id->toString()}&page=2&limit=5", $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']['data']);
        $this->assertEquals(15, $result['json']['pagination']['total']);
        $this->assertEquals(2, $result['json']['pagination']['page']);
        $this->assertTrue($result['json']['pagination']['hasNextPage']);
    }
}
