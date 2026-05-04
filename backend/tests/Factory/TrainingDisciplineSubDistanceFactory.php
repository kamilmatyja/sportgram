<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDisciplineSubDistance;
use Doctrine\ORM\EntityManagerInterface;

final class TrainingDisciplineSubDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): TrainingDisciplineSubDistance
    {
        $defaults = [
            'trainingDisciplineDistance' => TrainingDisciplineDistanceFactory::make(em: $em),
            'subDistance' => self::randomInt(),
            'time' => self::randomInt(),
            'lat' => self::randomInt(),
            'lng' => self::randomInt(),
            'accuracy' => self::randomInt(),
            'speed' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new TrainingDisciplineSubDistance(
            $data['trainingDisciplineDistance'],
            $data['subDistance'],
            $data['time'],
            $data['lat'],
            $data['lng'],
            $data['accuracy'],
            $data['speed'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
