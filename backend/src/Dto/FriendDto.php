<?php

namespace App\Dto;

use App\Entity\User;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['receiverUserId'],
    properties: [
        new OA\Property(
            property: 'receiverUserId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
    ],
    type: 'object',
)]
class FriendDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public string $receiverUserId;
}
