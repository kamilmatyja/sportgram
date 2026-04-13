<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserPasswordReset;
use App\Enum\UnauthorizedStatusEnum;

final class UserPasswordResetFactory extends BaseFactory
{
    public static function make(array $overrides = []): UserPasswordReset
    {
        $defaults = [
            'user' => UserFactory::make(),
            'code' => self::uniqueCode(),
            'attempt' => self::uniqueInt(),
            'status' => self::uniqueEnum(UnauthorizedStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new UserPasswordReset(
            $data['user'],
            $data['code'],
            $data['attempt'],
            $data['status']
        );
    }
}
