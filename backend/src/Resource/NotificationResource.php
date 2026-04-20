<?php

namespace App\Resource;

use App\Entity\Notification;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'NotificationResource',
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'text',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-02'),
        new OA\Property(property: 'text', type: 'string', example: 'You have a new message'),
        new OA\Property(property: 'link', type: 'string', example: '/messages/123'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class NotificationResource
{
    public static function fromEntity(Notification $notification): array
    {
        return [
            'id' => $notification->id?->toString(),
            'userId' => $notification->user->id?->toString(),
            'createdAt' => $notification->createdAt->format('Y-m-d'),
            'updatedAt' => $notification->updatedAt->format('Y-m-d'),
            'text' => $notification->text,
            'link' => $notification->link,
            'status' => $notification->status,
        ];
    }

    public static function fromEntityCollection(array $notifications): array
    {
        return array_map(fn (Notification $notification) => self::fromEntity($notification), $notifications);
    }
}
