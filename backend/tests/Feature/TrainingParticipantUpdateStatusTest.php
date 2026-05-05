<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{TrainingFactory, TrainingParticipantFactory};

class TrainingParticipantUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('training_participants');
        $this->truncate('trainings');
        $this->truncate('feeds');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $participantUser = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $training = TrainingFactory::make(['user' => $owner], $this->em);
        $participant = TrainingParticipantFactory::make(
            ['training' => $training, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/training-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsParticipant(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $participantUser = self::createUser(RoleEnum::Participant);

        $training = TrainingFactory::make(['user' => $owner], $this->em);
        $participant = TrainingParticipantFactory::make(
            ['training' => $training, 'user' => $participantUser, 'status' => SaveStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/training-participants/{$participant->id->toString()}/status",
            ['status' => 2],
            $participantUser,
        );
        $this->assertEquals(200, $result['status']);
    }
}
