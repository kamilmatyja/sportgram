<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{TrainingDiscipline, TrainingParticipant};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\TestCase;

class TrainingDisciplineTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $participant = $this->createMock(TrainingParticipant::class);
        $discipline = DisciplineEnum::Running;
        $entity = new TrainingDiscipline($participant, $discipline);
        $this->assertInstanceOf(TrainingDiscipline::class, $entity);
        $this->assertSame($participant, $entity->trainingParticipant);
        $this->assertSame($discipline, $entity->discipline);
    }
}
