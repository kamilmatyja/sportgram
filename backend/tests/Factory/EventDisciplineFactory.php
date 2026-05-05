<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDiscipline;
use App\Enum\DisciplineEnum;
use Doctrine\ORM\EntityManagerInterface;

final class EventDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): EventDiscipline
    {
        $defaults = [
            'event' => $overrides['event'] ?? EventFactory::make(em: $em),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new EventDiscipline(
            $data['event'],
            $data['discipline'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
