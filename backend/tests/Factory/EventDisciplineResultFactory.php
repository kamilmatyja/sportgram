<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineResult;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineResultFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDisciplineResult
    {
        $defaults = [
            'eventDisciplineList' => EventDisciplineListFactory::make(em: $em),
            'feed' => FeedFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'time' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDisciplineResult(
            $data['eventDisciplineList'],
            $data['feed'],
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
