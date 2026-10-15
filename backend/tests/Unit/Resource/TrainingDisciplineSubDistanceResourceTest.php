<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\TrainingDisciplineSubDistance;
use App\Resource\TrainingDisciplineSubDistanceResource;
use Tests\Factory\{TrainingDisciplineDistanceFactory, TrainingDisciplineSubDistanceFactory};

class TrainingDisciplineSubDistanceResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $subDistance = $this->subDistance();

        $data = TrainingDisciplineSubDistanceResource::fromEntity($subDistance);

        $this->assertSame([
            'id' => $subDistance->id,
            'trainingDisciplineDistanceId' => $subDistance->trainingDisciplineDistance->id,
            'createdAt' => self::formatDate($subDistance->createdAt),
            'updatedAt' => self::formatDate($subDistance->updatedAt),
            'subDistance' => $subDistance->subDistance,
            'time' => $subDistance->time,
            'lat' => $subDistance->lat,
            'lng' => $subDistance->lng,
            'accuracy' => $subDistance->accuracy,
            'speed' => $subDistance->speed,
        ], $data);
        $this->assertMatchesSchema(TrainingDisciplineSubDistanceResource::class, $data);
    }

    final public function testMapsMissingLocationDataToNull(): void
    {
        $data = TrainingDisciplineSubDistanceResource::fromEntity($this->subDistance([
            'lat' => null,
            'lng' => null,
            'accuracy' => null,
            'speed' => null,
        ]));

        $this->assertSame(
            ['lat' => null, 'lng' => null, 'accuracy' => null, 'speed' => null],
            array_intersect_key($data, array_flip(['lat', 'lng', 'accuracy', 'speed'])),
        );
        $this->assertMatchesSchema(TrainingDisciplineSubDistanceResource::class, $data);
    }

    private function subDistance(array $overrides = []): TrainingDisciplineSubDistance
    {
        return self::persisted(TrainingDisciplineSubDistanceFactory::make([
            'trainingDisciplineDistance' => self::persisted(TrainingDisciplineDistanceFactory::make()),
            ...$overrides,
        ]));
    }
}
