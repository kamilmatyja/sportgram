<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDisciplineDistance;
use Doctrine\ORM\EntityManagerInterface;

final class TrainingDisciplineDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): TrainingDisciplineDistance
    {
        $defaults = [
            'trainingDiscipline' => $overrides['trainingDiscipline'] ?? TrainingDisciplineFactory::make(em: $em),
            'distance' => self::randomInt(),
            'time' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new TrainingDisciplineDistance(
            $data['trainingDiscipline'],
            $data['distance'],
            $data['time'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
