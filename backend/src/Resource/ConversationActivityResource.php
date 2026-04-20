<?php

namespace App\Resource;

use App\Entity\ConversationActivity;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'ConversationActivityResource',
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'senderUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'receiverUserId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
    ],
    type: 'object',
)]
class ConversationActivityResource
{
    public static function fromEntity(ConversationActivity $activity): array
    {
        return [
            'id' => $activity->id?->toString(),
            'senderUserId' => $activity->senderUser->id?->toString(),
            'receiverUserId' => $activity->receiverUser->id?->toString(),
            'createdAt' => $activity->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $activity->updatedAt->format('Y-m-d\TH:i:s'),
        ];
    }

    public static function fromEntityCollection(array $activities): array
    {
        return array_map(fn (ConversationActivity $activity) => self::fromEntity($activity), $activities);
    }
}
