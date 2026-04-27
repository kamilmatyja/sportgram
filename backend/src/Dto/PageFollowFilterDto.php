<?php

namespace App\Dto;

use App\Entity\{Page, User};
use App\Enum\PageFollowStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'PageFollowFilterDto',
    required: ['userId'],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'pageIds',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            example: ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'],
            nullable: true,
        ),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class PageFollowFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public string $userId;

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: Page::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    public array $pageIds = [];

    #[Assert\Choice(callback: [PageFollowStatusEnum::class, 'values'])]
    public ?int $status = null;
}
