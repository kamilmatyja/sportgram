<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{TrainingDisciplineDistance, TrainingDisciplineSubDistance};
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
        $this->assertSame($distance, $entity->trainingDisciplineDistance);
        $this->assertSame($subDistance, $entity->subDistance);
        $this->assertSame($time, $entity->time);
        $this->assertSame($lat, $entity->lat);
        $this->assertSame($lng, $entity->lng);
        $this->assertSame($accuracy, $entity->accuracy);
        $this->assertSame($speed, $entity->speed);
    }
}
