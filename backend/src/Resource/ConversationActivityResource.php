<?php

namespace App\Resource;

use App\Entity\ConversationActivity;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
    ],
    properties: [
        new OA\Property(
            property: 'Id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'senderUserId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'receiverUserId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
    ],
    type: 'object',
)]
class ConversationActivityResource
{
    public static function fromEntity(ConversationActivity $activity): array
    {
        return [
            'id' => $activity->id->toString(),
            'senderUserId' => $activity->senderUser->id->toString(),
            'receiverUserId' => $activity->receiverUser->id->toString(),
            'createdAt' => $activity->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $activity->updatedAt->format('Y-m-d\TH:i:s'),
        ];
    }

    /** @param ConversationActivity[] $activities */
    public static function fromEntityCollection(array $activities): array
    {
        return array_map(fn (ConversationActivity $activity) => self::fromEntity($activity), $activities);
    }
}
