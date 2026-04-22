<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{CountryEnum, GenderEnum, UserStatusEnum};
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class UserFilterDto
{
    #[Assert\Length(min: 1, max: 64)]
    #[OA\Property(example: 'Jan')]
    public ?string $firstName = null;

    #[Assert\Length(min: 1, max: 64)]
    #[OA\Property(example: 'Kowalski')]
    public ?string $lastName = null;

    #[Assert\Choice(callback: [GenderEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $gender = null;

    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $country = null;

    #[Assert\Choice(callback: [UserStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;

    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    #[OA\Property(example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000'])]
    public ?array $userIds = null;
}
