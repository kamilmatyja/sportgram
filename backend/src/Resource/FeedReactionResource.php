<?php

namespace App\Resource;

use App\Entity\FeedReaction;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'feedId',
        'userId',
        'createdAt',
        'updatedAt',
        'reaction',
        'status',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'feedId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'reaction', type: 'integer', example: 1),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class FeedReactionResource
{
    public static function fromEntity(FeedReaction $feedReaction): array
    {
        return [
            'id' => $feedReaction->id->toString(),
            'feedId' => $feedReaction->feed->id->toString(),
            'userId' => $feedReaction->user->id->toString(),
            'createdAt' => $feedReaction->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $feedReaction->updatedAt->format('Y-m-d\TH:i:s'),
            'reaction' => $feedReaction->reaction->value,
            'status' => $feedReaction->status->value,
        ];
    }
}
