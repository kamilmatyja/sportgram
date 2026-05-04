<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDiscipline;
use App\Enum\DisciplineEnum;
use Doctrine\ORM\EntityManagerInterface;

final class TrainingDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): TrainingDiscipline
    {
        $defaults = [
            'training' => TrainingFactory::make(em: $em),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new TrainingDiscipline(
            $data['training'],
            $data['discipline'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
