<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\ElementStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'PageFilterDto',
    required: [],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
            nullable: true,
        ),
        new OA\Property(property: 'title', type: 'string', example: 'Page title', nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class PageFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?string $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    public ?string $title = null;

    #[Assert\Choice(callback: [ElementStatusEnum::class, 'values'])]
    public ?int $status = null;
}
