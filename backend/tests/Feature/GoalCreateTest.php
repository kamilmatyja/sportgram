<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\UserFactory;

class GoalCreateTest extends ApiTestCase
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

    final public function testUnauthorized(): void
    {
        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'New Goal',
            'link' => 'new-goal',
            'discipline' => 1,
            'distance' => 1000,
        ];

        $result = $this->post('/api/goals', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/goals', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['startedAt', 'endedAt', 'text', 'link', 'discipline', 'distance'];

        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals(['This value should not be blank.'], $result['json']['errors'][$field]);
        }
    }

    final public function testAddNonFriendParticipant(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $stranger = UserFactory::make(em: $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'New Goal',
            'link' => 'new-goal-1',
            'discipline' => 1,
            'distance' => 1000,
            'participants' => [$stranger->id->toString()],
        ];

        $result = $this->post('/api/goals', $payload, $user);
        $this->assertEquals(409, $result['status']);
        $this->assertEquals('User is not friend.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'text' => 'New Goal',
            'link' => 'my-new-goal',
            'discipline' => 1,
            'distance' => 1000,
            'time' => 3600,
        ];

        $result = $this->post('/api/goals', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
