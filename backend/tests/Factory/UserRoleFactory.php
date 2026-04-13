<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserRole;
use App\Enum\RoleEnum;

final class UserRoleFactory extends BaseFactory
{
    public static function make(array $overrides = []): UserRole
    {
        $defaults = [
            'user' => UserFactory::make(),
            'role' => self::randomEnum(RoleEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new UserRole(
            $data['user'],
            $data['role']
        );
    }
}
