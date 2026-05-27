<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\{GoalFactory, GoalParticipantFactory, GoalParticipantResultFactory};

class GoalUpdateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('goal_participant_results');
        $this->truncate('goal_participants');
        $this->truncate('goals');
        $this->truncate('feeds');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $goalOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $goal = GoalFactory::make(['user' => $goalOwner], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'Updated Goal',
            'link' => 'updated-goal',
            'discipline' => 1,
            'distance' => 1000,
        ];

        $result = $this->put("/api/goals/{$goal->id->toString()}", $payload, $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testCannotRemoveParticipantWithResults(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user], $this->em);

        GoalParticipantFactory::make(['goal' => $goal, 'user' => $user], $this->em);
        $participant2 = GoalParticipantFactory::make(['goal' => $goal, 'user' => $user2], $this->em);
        GoalParticipantResultFactory::make(['goalParticipant' => $participant2], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'Updated Goal',
            'link' => 'updated-goal',
            'discipline' => 1,
            'distance' => 1000,
            'participants' => [],
        ];

        $result = $this->put("/api/goals/{$goal->id->toString()}", $payload, $user);

        $this->assertEquals(409, $result['status']);
        $this->assertEquals('Cannot delete goal participant with results.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $goal = GoalFactory::make(['user' => $user], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'Updated Goal',
            'link' => 'updated-goal',
            'discipline' => 2,
            'distance' => 2000,
            'time' => 7200,
            'participants' => [$user->id->toString()],
        ];

        $result = $this->put("/api/goals/{$goal->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
