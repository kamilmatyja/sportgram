<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, RoleEnum, ThemeEnum};
use App\Validator\{Base64String, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema]
class UserCreateDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d')]
    #[OA\Property(example: '2000-01-01')]
    public string $birthAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    #[OA\Property(example: 'Jan')]
    public string $firstName;

    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    #[OA\Property(example: 'Kowalski')]
    public string $lastName;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [GenderEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $gender;

    #[Assert\NotBlank]
    #[Assert\Range(min: 100000000, max: 999999999)]
    #[UniqueField(entity: User::class, field: 'phone')]
    #[OA\Property(example: 123456789)]
    public int $phone;

    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(min: 5, max: 64)]
    #[UniqueField(entity: User::class, field: 'email')]
    #[OA\Property(example: 'test@test.pl')]
    public string $email;

    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 32)]
    #[OA\Property(example: 'password123')]
    public string $password;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[UniqueField(entity: User::class, field: 'link')]
    #[OA\Property(example: 'my-link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [LanguageEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $language;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $country;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ThemeEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $theme;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ColorEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $color;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $profilePhoto;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $backgroundPhoto;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 2048)]
    #[OA\Property(example: 'bio...')]
    public string $bio;

    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Choice(callback: [RoleEnum::class, 'values']),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    #[OA\Property(example: [1, 2])]
    public array $roles;
}
