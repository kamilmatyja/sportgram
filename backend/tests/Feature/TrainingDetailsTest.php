<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{TrainingDisciplineDistanceFactory,
    TrainingDisciplineFactory,
    TrainingDisciplineSubDistanceFactory,
    TrainingFactory,
    TrainingParticipantFactory};

class TrainingDetailsTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_discipline_sub_distances');
        $this->truncate('training_discipline_distances');
        $this->truncate('training_disciplines');
        $this->truncate('training_participants');
        $this->truncate('trainings');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $trainingId = Uuid::v4()->toString();

        $result = $this->get("/api/trainings/{$trainingId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $training = TrainingFactory::make(['user' => $user], $this->em);

        TrainingParticipantFactory::make(['training' => $training, 'user' => $user], $this->em);

        $discipline = TrainingDisciplineFactory::make(['training' => $training], $this->em);
        $distance = TrainingDisciplineDistanceFactory::make(['trainingDiscipline' => $discipline], $this->em);
        TrainingDisciplineSubDistanceFactory::make(['trainingDisciplineDistance' => $distance], $this->em);

        $url = "/api/trainings/{$training->id->toString()}?include[]=trainingParticipants&include[]=trainingDisciplines&include[]=trainingDisciplineDistances&include[]=trainingDisciplineSubDistances";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);

        $this->assertArrayHasKey('participants', $result['json']);
        $this->assertCount(1, $result['json']['participants']);

        $this->assertArrayHasKey('disciplines', $result['json']);
        $this->assertCount(1, $result['json']['disciplines']);

        $this->assertArrayHasKey('distances', $result['json']['disciplines'][0]);
        $this->assertCount(1, $result['json']['disciplines'][0]['distances']);

        $this->assertArrayHasKey('subDistances', $result['json']['disciplines'][0]['distances'][0]);
        $this->assertCount(1, $result['json']['disciplines'][0]['distances'][0]['subDistances']);
    }
}
