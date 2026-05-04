<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineList;
use App\Enum\SaveStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineListFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDisciplineList
    {
        $defaults = [
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make(em: $em),
            'feed' => FeedFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDisciplineList(
            $data['eventDisciplineDistance'],
            $data['feed'],
            $data['user'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
