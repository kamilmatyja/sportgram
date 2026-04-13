<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDisciplineSubDistance;

final class TrainingDisciplineSubDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = []): TrainingDisciplineSubDistance
    {
        $defaults = [
            'trainingDisciplineDistance' => TrainingDisciplineDistanceFactory::make(),
            'subDistance' => self::uniqueInt(),
            'time' => self::uniqueInt(),
            'lat' => self::uniqueInt(),
            'lng' => self::uniqueInt(),
            'accuracy' => self::uniqueInt(),
            'speed' => self::uniqueInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new TrainingDisciplineSubDistance(
            $data['trainingDisciplineDistance'],
            $data['subDistance'],
            $data['time'],
            $data['lat'],
            $data['lng'],
            $data['accuracy'],
            $data['speed']
        );
    }
}
