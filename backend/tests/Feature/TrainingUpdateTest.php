<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\{TrainingFactory};

class TrainingUpdateTest extends ApiTestCase
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
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $training = TrainingFactory::make(['user' => $owner], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'Updated Training',
            'description' => 'Desc',
            'link' => 'updated-training',
            'location' => 'Warsaw',
        ];

        $result = $this->put("/api/trainings/{$training->id->toString()}", $payload, $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $training = TrainingFactory::make(['user' => $user], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'Updated Training',
            'description' => 'Desc',
            'link' => 'updated-training',
            'location' => 'Warsaw',
            'disciplines' => [
                [
                    'discipline' => 2,
                    'distances' => [
                        [
                            'distance' => 10000,
                            'time' => 3600,
                        ],
                    ],
                ],
            ],
            'participants' => [$user->id->toString()],
        ];

        $result = $this->put("/api/trainings/{$training->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
