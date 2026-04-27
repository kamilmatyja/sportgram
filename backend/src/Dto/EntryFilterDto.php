<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\EntryTypeEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EntryFilterDto',
    required: [],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
            nullable: true,
        ),
        new OA\Property(
            property: 'entityIds',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            example: ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'],
            nullable: true,
        ),
        new OA\Property(property: 'type', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class EntryFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?string $userId = null;

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
    ])]
    #[Assert\Count(min: 0)]
    #[Assert\Unique]
    public array $entityIds = [];

    #[Assert\Choice(callback: [EntryTypeEnum::class, 'values'])]
    public ?int $type = null;
}
