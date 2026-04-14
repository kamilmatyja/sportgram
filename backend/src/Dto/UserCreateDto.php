<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\ColorEnum;
use App\Enum\CountryEnum;
use App\Enum\GenderEnum;
use App\Enum\LanguageEnum;
use App\Enum\RoleEnum;
use App\Enum\ThemeEnum;
use App\Validator\Base64String;
use App\Validator\UniqueField;
use Symfony\Component\Validator\Constraints as Assert;

class UserCreateDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d')]
    public string $birthAt;
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    public string $firstName;
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    public string $lastName;
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [GenderEnum::class, 'values'])]
    public int $gender;
    #[Assert\NotBlank]
    #[Assert\Range(min: 1000, max: 999999999999)]
    #[UniqueField(entity: User::class, field: 'phone')]
    public int $phone;
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(min: 5, max: 64)]
    #[UniqueField(entity: User::class, field: 'email')]
    public string $email;
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 32)]
    public string $password;
    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[UniqueField(entity: User::class, field: 'link')]
    public string $link;
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [LanguageEnum::class, 'values'])]
    public int $language;
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    public int $country;
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ThemeEnum::class, 'values'])]
    public int $theme;
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'])]
    public int $color;
    #[Assert\NotBlank]
    #[Base64String]
    public string $profilePhoto;
    #[Assert\NotBlank]
    #[Base64String]
    public string $backgroundPhoto;
    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 1024)]
    public string $bio;
    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Choice(callback: [RoleEnum::class, 'values'])
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $roles;
}
