<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserRole;
use App\Enum\RoleEnum;
use Doctrine\ORM\EntityManagerInterface;

final class UserRoleFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): UserRole
    {
        $defaults = [
            'user' => UserFactory::make(em: $em),
            'role' => self::randomEnum(RoleEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new UserRole(
            $data['user'],
            $data['role'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
