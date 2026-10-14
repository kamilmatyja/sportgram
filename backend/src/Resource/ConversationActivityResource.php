<?php

namespace App\Resource;

use App\Entity\ConversationActivity;
use DateTime;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
        'isWriting',
    ],
    properties: [
        new OA\Property(
            property: 'id',
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
        new OA\Property(property: 'isWriting', type: 'boolean', example: false),
    ],
    type: 'object',
)]
class ConversationActivityResource
{
    public static function fromEntity(ConversationActivity $activity): array
    {
        $isWriting = $activity->updatedAt >= new DateTime('-5 seconds');

        return [
            'id' => $activity->id,
            'senderUserId' => $activity->senderUser->id,
            'receiverUserId' => $activity->receiverUser->id,
            'createdAt' => $activity->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $activity->updatedAt->format('Y-m-d\TH:i:s'),
            'isWriting' => $isWriting,
        ];
    }

    /** @param ConversationActivity[] $activities */
    public static function fromEntityCollection(array $activities): array
    {
        return array_map(fn (ConversationActivity $activity) => self::fromEntity($activity), $activities);
    }
}
