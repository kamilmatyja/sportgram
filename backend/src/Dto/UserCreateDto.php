<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{ColorEnum, CountryEnum, DisciplineEnum, GenderEnum, LanguageEnum, RoleEnum, ThemeEnum};
use App\Validator\{Base64String, UniqueField};
use DateTimeImmutable;
use OpenApi\Attributes as OA;
use Symfony\Component\Serializer\Attribute\Context;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [
        'birthAt',
        'firstName',
        'lastName',
        'gender',
        'phone',
        'email',
        'password',
        'link',
        'language',
        'country',
        'theme',
        'color',
        'profilePhoto',
        'backgroundPhoto',
        'bio',
        'roles',
    ],
    properties: [
        new OA\Property(property: 'birthAt', type: 'string', format: 'date', example: '2000-01-01'),
        new OA\Property(property: 'firstName', type: 'string', example: 'Jan'),
        new OA\Property(property: 'lastName', type: 'string', example: 'Kowalski'),
        new OA\Property(property: 'gender', type: 'integer', example: 1),
        new OA\Property(property: 'phone', type: 'integer', example: 123456789),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jan@kowalski.pl'),
        new OA\Property(property: 'password', type: 'string', example: 'password123'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'language', type: 'integer', example: 1),
        new OA\Property(property: 'country', type: 'integer', example: 1),
        new OA\Property(property: 'theme', type: 'integer', example: 1),
        new OA\Property(property: 'color', type: 'integer', example: 1),
        new OA\Property(property: 'profilePhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'backgroundPhoto', type: 'string', example: 'base64string'),
        new OA\Property(property: 'bio', type: 'string', example: 'Example text'),
        new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'integer'), example: [1]),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(type: 'integer'),
            example: [1],
            nullable: true,
        ),
    ],
    type: 'object',
)]
class UserCreateDto
{
    #[Assert\NotBlank]
    #[Context([DateTimeNormalizer::FORMAT_KEY => '!Y-m-d'])]
    public DateTimeImmutable $birthAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    public string $firstName;

    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    public string $lastName;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [GenderEnum::class, 'cases'])]
    public GenderEnum $gender;

    #[Assert\NotBlank]
    #[Assert\Range(min: 100000000, max: 999999999)]
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
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: User::class, field: 'link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [LanguageEnum::class, 'cases'])]
    public LanguageEnum $language;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [CountryEnum::class, 'cases'])]
    public CountryEnum $country;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ThemeEnum::class, 'cases'])]
    public ThemeEnum $theme;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ColorEnum::class, 'cases'])]
    public ColorEnum $color;

    #[Assert\NotBlank]
    #[Base64String]
    public string $profilePhoto;

    #[Assert\NotBlank]
    #[Base64String]
    public string $backgroundPhoto;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 2048)]
    public string $bio;

    /** @var RoleEnum[] */
    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Choice(callback: [RoleEnum::class, 'cases']),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $roles = [];

    /** @var DisciplineEnum[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Choice(callback: [DisciplineEnum::class, 'cases']),
    ])]
    #[Assert\Count(min: 0)]
    #[Assert\Unique]
    public array $disciplines = [];

    final public function addRole(RoleEnum $role): void
    {
        $this->roles[] = $role;
    }

    final public function addDiscipline(DisciplineEnum $discipline): void
    {
        $this->disciplines[] = $discipline;
    }
}
