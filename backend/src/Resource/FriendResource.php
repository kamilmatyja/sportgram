<?php

namespace App\Resource;

use App\Entity\Friend;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FriendResource',
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'senderUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'receiverUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class FriendResource
{
    public static function fromEntity(Friend $friend): array
    {
        return [
            'id' => $friend->id->toString(),
            'senderUserId' => $friend->senderUser->id->toString(),
            'receiverUserId' => $friend->receiverUser->id->toString(),
            'createdAt' => $friend->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $friend->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $friend->status->value,
        ];
    }

    public static function fromEntityCollection(array $friends): array
    {
        return array_map(fn (Friend $friend) => self::fromEntity($friend), $friends);
    }
}
