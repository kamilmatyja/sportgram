<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDisciplineDistance;

final class TrainingDisciplineDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = []): TrainingDisciplineDistance
    {
        $defaults = [
            'trainingDiscipline' => TrainingDisciplineFactory::make(),
            'distance' => self::uniqueInt(),
            'time' => self::uniqueInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new TrainingDisciplineDistance(
            $data['trainingDiscipline'],
            $data['distance'],
            $data['time']
        );
    }
}
