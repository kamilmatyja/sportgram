<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\FriendStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'FriendFilterDto',
    required: ['receiverUserId'],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class FriendFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public string $userId;

    #[Assert\Choice(callback: [FriendStatusEnum::class, 'values'])]
    public ?int $status = null;
}
