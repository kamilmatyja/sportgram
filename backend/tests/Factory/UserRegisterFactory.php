<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserRegister;
use App\Enum\UnauthorizedStatusEnum;

final class UserRegisterFactory extends BaseFactory
{
    public static function make(array $overrides = []): UserRegister
    {
        $defaults = [
            'user' => UserFactory::make(),
            'code' => self::uniqueCode(),
            'attempt' => self::uniqueInt(),
            'status' => self::uniqueEnum(UnauthorizedStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new UserRegister(
            $data['user'],
            $data['code'],
            $data['attempt'],
            $data['status']
        );
    }
}
