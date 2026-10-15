<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
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

    final public function testValidationFailedInvalidUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $userId = Uuid::v4()->toString();

        $result = $this->get("/api/trainings?filter[userId]={$userId}", $user);
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
        $this->assertCount(1, $result['json']['data']);
        $this->assertEquals(1, $result['json']['pagination']['total']);
        $this->assertEquals('Morning Run', $result['json']['data'][0]['title']);
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
        $this->assertCount(5, $result['json']['data']);
        $this->assertEquals(15, $result['json']['pagination']['total']);
        $this->assertEquals(2, $result['json']['pagination']['page']);
        $this->assertTrue($result['json']['pagination']['hasNextPage']);
    }
}
