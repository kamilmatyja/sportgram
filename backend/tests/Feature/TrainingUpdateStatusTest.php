<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\TrainingFactory;

class TrainingUpdateStatusTest extends ApiTestCase
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

        $training = TrainingFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/trainings/{$training->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $admin = self::createUser(RoleEnum::Administrator);

        $training = TrainingFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/trainings/{$training->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $training = TrainingFactory::make(['user' => $user, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/trainings/{$training->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
