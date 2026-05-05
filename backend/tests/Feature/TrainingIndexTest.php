<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory};

class TrainingIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_participants');
        $this->truncate('trainings');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/trainings');
        $this->assertEquals(401, $result['status']);
    }

    final public function testValidationFailedMissingUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/trainings', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('filter.userId', $result['json']['errors']);
    }

    final public function testSuccessWithFilters(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $training1 = TrainingFactory::make(
            ['user' => $user, 'title' => 'Morning Run', 'status' => ElementStatusEnum::Active],
            $this->em,
        );
        TrainingParticipantFactory::make(['training' => $training1, 'user' => $user], $this->em);

        $training2 = TrainingFactory::make(
            ['user' => $user, 'title' => 'Evening Run', 'status' => ElementStatusEnum::Draft],
            $this->em,
        );
        TrainingParticipantFactory::make(['training' => $training2, 'user' => $user], $this->em);

        $result = $this->get(
            "/api/trainings?filter[userId]={$user->id->toString()}&filter[status]=" . ElementStatusEnum::Active->value,
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals('Morning Run', $result['json'][0]['title']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            $training = TrainingFactory::make(['user' => $user], $this->em);
            TrainingParticipantFactory::make(['training' => $training, 'user' => $user], $this->em);
        }

        $result = $this->get("/api/trainings?filter[userId]={$user->id->toString()}&page=2&limit=5", $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
