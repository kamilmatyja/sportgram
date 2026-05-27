<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory};

class TrainingDeleteTest extends ApiTestCase
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

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $training = TrainingFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/trainings/{$training->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testCannotDeleteTrainingWithParticipants(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $training = TrainingFactory::make(['user' => $user], $this->em);

        TrainingParticipantFactory::make(['training' => $training, 'user' => $user], $this->em);

        $result = $this->delete("/api/trainings/{$training->id->toString()}", $user);

        $this->assertEquals(409, $result['status']);
        $this->assertEquals('Cannot delete training with participants.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $training = TrainingFactory::make(['user' => $user], $this->em);

        $result = $this->delete("/api/trainings/{$training->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
