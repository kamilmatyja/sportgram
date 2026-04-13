<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Training;
use App\Entity\TrainingParticipant;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class TrainingParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $training = $this->createMock(Training::class);
        $user = $this->createMock(User::class);
        $entity = new TrainingParticipant($training, $user);
        $this->assertInstanceOf(TrainingParticipant::class, $entity);
        $this->assertSame($training, $entity->getTraining());
        $this->assertSame($user, $entity->getUser());
    }
}
