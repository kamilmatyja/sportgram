<?php

namespace App\Resource;

use App\Entity\{PushSubscription};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PushSubscriptionResource',
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'endpoint',
        'p256dh',
        'auth',
        'userAgent',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'endpoint', type: 'string', example: 'endpoint-url'),
        new OA\Property(property: 'p256dh', type: 'string', example: 'p256dh-key'),
        new OA\Property(property: 'auth', type: 'string', example: 'auth-key'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class PushSubscriptionResource
{
    public static function fromEntity(PushSubscription $pushSubscription): array
    {
        return [
            'id' => $pushSubscription->id?->toString(),
            'userId' => $pushSubscription->user->id?->toString(),
            'createdAt' => $pushSubscription->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $pushSubscription->updatedAt->format('Y-m-d\TH:i:s'),
            'endpoint' => $pushSubscription->endpoint,
            'p256dh' => $pushSubscription->p256dh,
            'auth' => $pushSubscription->auth,
            'status' => $pushSubscription->status,
        ];
    }

    public static function fromEntityCollection(array $pushSubscriptions): array
    {
        return array_map(
            fn (PushSubscription $pushSubscription) => self::fromEntity($pushSubscription),
            $pushSubscriptions,
        );
    }
}
