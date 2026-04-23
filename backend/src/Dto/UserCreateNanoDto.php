<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{CountryEnum, GenderEnum, RoleEnum};
use App\Validator\{UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'UserCreateNanoDto',
    required: [
        'birthAt',
        'firstName',
        'lastName',
        'gender',
        'phone',
        'email',
        'password',
        'country',
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
        new OA\Property(property: 'country', type: 'integer', example: 1),
        new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'integer'), example: [1]),
    ],
    type: 'object',
)]
class UserCreateNanoDto
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
    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    public int $country;

    /** @var int[] */
    #[Assert\NotBlank]
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Choice(callback: [RoleEnum::class, 'nano']),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $roles;
}
