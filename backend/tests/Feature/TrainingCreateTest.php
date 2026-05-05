<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\UserFactory;

class TrainingCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_discipline_sub_distances');
        $this->truncate('training_discipline_distances');
        $this->truncate('training_disciplines');
        $this->truncate('training_participants');
        $this->truncate('trainings');
        $this->truncate('feeds');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My Training',
            'description' => 'Desc',
            'link' => 'training-link',
            'location' => 'Warsaw',
        ];

        $result = $this->post('/api/trainings', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/trainings', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['startedAt', 'endedAt', 'title', 'description', 'link', 'location'];

        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals(['This value should not be blank.'], $result['json']['errors'][$field]);
        }
    }

    final public function testDuplicateLink(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        \Tests\Factory\TrainingFactory::make(['user' => $user, 'link' => 'duplicate-link'], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My Training',
            'description' => 'Desc',
            'link' => 'duplicate-link',
            'location' => 'Warsaw',
            'disciplines' => [],
        ];

        $result = $this->post('/api/trainings', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('link', $result['json']['errors']);
        $this->assertEquals(['This value is already used.'], $result['json']['errors']['link']);
    }

    final public function testAddNonFriendParticipant(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $stranger = UserFactory::make(em: $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My Training',
            'description' => 'Desc',
            'link' => 'unique-link-1',
            'location' => 'Warsaw',
            'participants' => [$stranger->id->toString()],
        ];

        $result = $this->post('/api/trainings', $payload, $user);
        $this->assertEquals(409, $result['status']);
        $this->assertEquals('User is not friend.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My Training',
            'description' => 'Desc',
            'link' => 'unique-link-2',
            'location' => 'Warsaw',
            'disciplines' => [
                [
                    'discipline' => 1,
                    'distances' => [
                        [
                            'distance' => 5000,
                            'time' => 1800,
                            'subDistances' => [
                                [
                                    'subDistance' => 1000,
                                    'time' => 360,
                                    'lat' => 52,
                                    'lng' => 21,
                                    'accuracy' => 5,
                                    'speed' => 15,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'participants' => [],
        ];

        $result = $this->post('/api/trainings', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
