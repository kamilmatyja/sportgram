<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserSign;
use App\Enum\UnauthorizedStatusEnum;

final class UserSignFactory extends BaseFactory
{
    public static function make(array $overrides = []): UserSign
    {
        $defaults = [
            'user' => UserFactory::make(),
            'code' => self::uniqueCode(),
            'attempt' => self::uniqueInt(),
            'status' => self::uniqueEnum(UnauthorizedStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new UserSign(
            $data['user'],
            $data['code'],
            $data['attempt'],
            $data['status']
        );
    }
}
