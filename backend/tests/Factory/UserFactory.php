<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\User;
use App\Enum\ColorEnum;
use App\Enum\CountryEnum;
use App\Enum\GenderEnum;
use App\Enum\LanguageEnum;
use App\Enum\ThemeEnum;
use App\Enum\UserStatusEnum;

final class UserFactory extends BaseFactory
{
    public static function make(array $overrides = []): User
    {
        $defaults = [
            'birthAt' => self::uniqueDate(),
            'firstName' => self::uniqueName(),
            'lastName' => self::uniqueName(),
            'gender' => self::uniqueEnum(GenderEnum::class),
            'phone' => self::uniqueInt(),
            'email' => self::uniqueEmail(),
            'password' => self::uniqueString('password'),
            'link' => self::uniqueString('link'),
            'language' => self::uniqueEnum(LanguageEnum::class),
            'country' => self::uniqueEnum(CountryEnum::class),
            'theme' => self::uniqueEnum(ThemeEnum::class),
            'color' => self::uniqueEnum(ColorEnum::class),
            'profilePhoto' => self::uniqueBinaryFileString(),
            'backgroundPhoto' => self::uniqueBinaryFileString(),
            'bio' => self::uniqueString('bio'),
            'status' => self::uniqueEnum(UserStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new User(
            $data['birthAt'],
            $data['firstName'],
            $data['lastName'],
            $data['gender'],
            $data['phone'],
            $data['email'],
            $data['password'],
            $data['link'],
            $data['language'],
            $data['country'],
            $data['theme'],
            $data['color'],
            $data['profilePhoto'],
            $data['backgroundPhoto'],
            $data['bio'],
            $data['status']
        );
    }
}
