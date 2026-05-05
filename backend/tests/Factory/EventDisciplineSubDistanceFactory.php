<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineSubDistance;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineSubDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDisciplineSubDistance
    {
        $defaults = [
            'eventDisciplineDistance' => $overrides['eventDisciplineDistance'] ?? EventDisciplineDistanceFactory::make(
                em: $em,
            ),
            'subDistance' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDisciplineSubDistance(
            $data['eventDisciplineDistance'],
            $data['subDistance'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
