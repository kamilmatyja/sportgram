<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineSubResult;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineSubResultFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDisciplineSubResult
    {
        $defaults = [
            'eventDisciplineSubDistance' => EventDisciplineSubDistanceFactory::make(em: $em),
            'eventDisciplineResult' => EventDisciplineResultFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'time' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDisciplineSubResult(
            $data['eventDisciplineSubDistance'],
            $data['eventDisciplineResult'],
            $data['user'],
            $data['time'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
