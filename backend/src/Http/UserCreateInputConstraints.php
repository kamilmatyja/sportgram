<?php

namespace App\Http;

use App\Enum\ColorEnum;
use App\Enum\CountryEnum;
use App\Enum\GenderEnum;
use App\Enum\LanguageEnum;
use App\Enum\RoleEnum;
use App\Enum\ThemeEnum;
use App\Enum\UserStatusEnum;
use App\Validator\Base64String;
use App\Validator\UniqueUserField;
use Symfony\Component\Validator\Constraints as Assert;

class UserCreateInputConstraints
{
    public static function get(): Assert\Collection
    {
        return new Assert\Collection(fields: [
            'birthAt' => [new Assert\NotBlank(), new Assert\DateTime('Y-m-d')],
            'firstName' => [new Assert\NotBlank(), new Assert\Length(max: 64)],
            'lastName' => [new Assert\NotBlank(), new Assert\Length(max: 64)],
            'gender' => [new Assert\NotBlank(), new Assert\Choice(choices: GenderEnum::values())],
            'phone' => [new Assert\NotBlank(), new Assert\Length(max: 16), new UniqueUserField(field: 'phone')],
            'email' => [
                new Assert\NotBlank(),
                new Assert\Email(),
                new Assert\Length(max: 64),
                new UniqueUserField(field: 'email')
            ],
            'password' => [new Assert\NotBlank(), new Assert\Length(min: 8, max: 32)],
            'link' => [new Assert\NotBlank(), new Assert\Length(max: 64)],
            'language' => [new Assert\NotBlank(), new Assert\Choice(choices: LanguageEnum::values())],
            'country' => [new Assert\NotBlank(), new Assert\Choice(choices: CountryEnum::values())],
            'theme' => [new Assert\NotBlank(), new Assert\Choice(choices: ThemeEnum::values())],
            'color' => [new Assert\NotBlank(), new Assert\Choice(choices: ColorEnum::values())],
            'profilePhoto' => [new Assert\NotBlank(), new Base64String()],
            'backgroundPhoto' => [new Assert\NotBlank(), new Base64String()],
            'bio' => [new Assert\NotBlank(), new Assert\Length(max: 1024)],
            'status' => [new Assert\NotBlank(), new Assert\Choice(choices: UserStatusEnum::values())],
            'roles' => [
                new Assert\NotBlank(),
                new Assert\All([
                    new Assert\NotBlank(),
                    new Assert\Choice(choices: RoleEnum::values())
                ]),
                new Assert\Unique()
            ],

        ], allowExtraFields: false, allowMissingFields: false);
    }
}
