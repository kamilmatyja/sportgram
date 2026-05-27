<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalDetailsTest extends ApiTestCase
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

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goalId = Uuid::v4()->toString();

        $result = $this->get("/api/goals/{$goalId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user], $this->em);

        $participant = GoalParticipantFactory::make(['goal' => $goal, 'user' => $user], $this->em);
        GoalParticipantResultFactory::make(['goalParticipant' => $participant], $this->em);

        $url = "/api/goals/{$goal->id->toString()}?include[]=goalParticipants&include[]=goalParticipantResults";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertArrayHasKey('participants', $result['json']);
        $this->assertCount(1, $result['json']['participants']);
        $this->assertArrayHasKey('results', $result['json']['participants'][0]);
        $this->assertCount(1, $result['json']['participants'][0]['results']);
    }
}
