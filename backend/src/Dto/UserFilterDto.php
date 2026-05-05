<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{CountryEnum, GenderEnum, UserStatusEnum};
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'firstName', type: 'string', example: 'Jan', nullable: true),
        new OA\Property(property: 'lastName', type: 'string', example: 'Kowalski', nullable: true),
        new OA\Property(property: 'gender', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'country', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
        new OA\Property(
            property: 'userIds',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            example: ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'],
            nullable: true,
        ),
        new OA\Property(property: 'link', type: 'string', example: 'my-link', nullable: true),
    ],
    type: 'object',
)]
class UserFilterDto
{
    #[Assert\Length(min: 1, max: 64)]
    public ?string $firstName = null;

    #[Assert\Length(min: 1, max: 64)]
    public ?string $lastName = null;

    #[Assert\Choice(callback: [GenderEnum::class, 'values'])]
    public ?int $gender = null;

    #[Assert\Choice(callback: [CountryEnum::class, 'values'])]
    public ?int $country = null;

    #[Assert\Choice(callback: [UserStatusEnum::class, 'values'])]
    public ?int $status = null;

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 0)]
    #[Assert\Unique]
    public array $userIds = [];

    #[Assert\Length(min: 1, max: 64)]
    public ?string $link = null;
}
