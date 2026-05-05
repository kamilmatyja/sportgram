<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserDiscipline;
use App\Enum\DisciplineEnum;
use Doctrine\ORM\EntityManagerInterface;

final class UserDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): UserDiscipline
    {
        $defaults = [
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new UserDiscipline(
            $data['user'],
            $data['discipline'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
