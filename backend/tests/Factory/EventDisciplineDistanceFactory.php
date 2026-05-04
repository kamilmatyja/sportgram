<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineDistance;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDisciplineDistance
    {
        $defaults = [
            'eventDiscipline' => EventDisciplineFactory::make(em: $em),
            'distance' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDisciplineDistance(
            $data['eventDiscipline'],
            $data['distance'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
