<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Training, TrainingParticipant, User};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class TrainingParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $training = $this->createMock(Training::class);
        $user = $this->createMock(User::class);
        $status = SaveStatusEnum::Pending;
        $entity = new TrainingParticipant($training, $user, $status);
        $this->assertInstanceOf(TrainingParticipant::class, $entity);
        $this->assertSame($training, $entity->training);
        $this->assertSame($user, $entity->user);
        $this->assertSame($status, $entity->status);
    }
}
