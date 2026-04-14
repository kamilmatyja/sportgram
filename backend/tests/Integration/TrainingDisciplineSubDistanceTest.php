<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\TrainingDisciplineDistance;
use App\Entity\TrainingDisciplineSubDistance;
use PHPUnit\Framework\TestCase;

class TrainingDisciplineSubDistanceTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $distance = $this->createMock(TrainingDisciplineDistance::class);
        $subDistance = 5000;
        $time = 1234;
        $lat = 51;
        $lng = 19;
        $accuracy = 10;
        $speed = 5;
        $entity = new TrainingDisciplineSubDistance($distance, $subDistance, $time, $lat, $lng, $accuracy, $speed);
        $this->assertInstanceOf(TrainingDisciplineSubDistance::class, $entity);
        $this->assertSame($distance, $entity->getTrainingDisciplineDistance());
        $this->assertSame($subDistance, $entity->getSubDistance());
        $this->assertSame($time, $entity->getTime());
        $this->assertSame($lat, $entity->getLat());
        $this->assertSame($lng, $entity->getLng());
        $this->assertSame($accuracy, $entity->getAccuracy());
        $this->assertSame($speed, $entity->getSpeed());
    }
}
