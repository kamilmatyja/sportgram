<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\TrainingDiscipline;
use App\Entity\TrainingDisciplineDistance;
use PHPUnit\Framework\TestCase;

class TrainingDisciplineDistanceTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $discipline = $this->createMock(TrainingDiscipline::class);
        $distance = 10000;
        $time = 3600;
        $entity = new TrainingDisciplineDistance($discipline, $distance, $time);
        $this->assertInstanceOf(TrainingDisciplineDistance::class, $entity);
        $this->assertSame($discipline, $entity->getTrainingDiscipline());
        $this->assertSame($distance, $entity->getDistance());
        $this->assertSame($time, $entity->getTime());
    }
}
