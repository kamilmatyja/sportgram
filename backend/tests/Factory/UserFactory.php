<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\User;
use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, ThemeEnum, UserStatusEnum};

final class UserFactory extends BaseFactory
{
    public static function make(array $overrides = []): User
    {
        $defaults = [
            'birthAt' => self::randomData(),
            'firstName' => self::randomName(),
            'lastName' => self::randomName(),
            'gender' => self::randomEnum(GenderEnum::class),
            'phone' => self::randomInt(),
            'email' => self::randomEmail(),
            'link' => self::randomString('link'),
            'language' => self::randomEnum(LanguageEnum::class),
            'country' => self::randomEnum(CountryEnum::class),
            'theme' => self::randomEnum(ThemeEnum::class),
            'color' => self::randomEnum(ColorEnum::class),
            'profilePhoto' => self::randoBinary(),
            'backgroundPhoto' => self::randoBinary(),
            'bio' => self::randomString('bio'),
            'status' => self::randomEnum(UserStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $user = new User(
            $data['birthAt'],
            $data['firstName'],
            $data['lastName'],
            $data['gender'],
            $data['phone'],
            $data['email'],
            $data['link'],
            $data['language'],
            $data['country'],
            $data['theme'],
            $data['color'],
            $data['profilePhoto'],
            $data['backgroundPhoto'],
            $data['bio'],
            $data['status'],
        );

        $user->password = self::randomString('password');

        return $user;
    }
}
