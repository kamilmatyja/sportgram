<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Training, TrainingDiscipline};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\TestCase;

class TrainingDisciplineTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $training = $this->createMock(Training::class);
        $discipline = DisciplineEnum::Running;
        $entity = new TrainingDiscipline($training, $discipline);
        $this->assertInstanceOf(TrainingDiscipline::class, $entity);
        $this->assertSame($training, $entity->training);
        $this->assertSame($discipline, $entity->discipline);
    }
}
