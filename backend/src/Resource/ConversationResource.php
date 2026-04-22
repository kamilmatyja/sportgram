<?php

namespace App\Resource;

use App\Entity\Conversation;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ConversationResource',
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
        'text',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'senderUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'receiverUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Hello!'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class ConversationResource
{
    public static function fromEntity(Conversation $conversation): array
    {
        return [
            'id' => $conversation->id->toString(),
            'senderUserId' => $conversation->senderUser->id->toString(),
            'receiverUserId' => $conversation->receiverUser->id->toString(),
            'createdAt' => $conversation->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $conversation->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $conversation->text,
            'status' => $conversation->status->value,
        ];
    }

    public static function fromEntityCollection(array $conversations): array
    {
        return array_map(fn (Conversation $conversation) => self::fromEntity($conversation), $conversations);
    }
}
