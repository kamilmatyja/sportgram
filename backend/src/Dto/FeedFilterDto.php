<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\FriendStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
            nullable: true,
        ),
        new OA\Property(property: 'text', type: 'string', example: 'New post', nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class FeedFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public ?string $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    public ?string $text = null;

    #[Assert\Choice(callback: [FriendStatusEnum::class, 'values'])]
    public ?int $status = null;
}
