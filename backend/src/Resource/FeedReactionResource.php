<?php

namespace App\Resource;

use App\Entity\FeedReaction;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FeedReactionResource',
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
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'feedId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
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
            'id' => $feedReaction->id,
            'feedId' => $feedReaction->feed->id,
            'userId' => $feedReaction->user->id,
            'createdAt' => $feedReaction->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $feedReaction->updatedAt->format('Y-m-d\TH:i:s'),
            'reaction' => $feedReaction->reaction,
            'status' => $feedReaction->status,
        ];
    }
}
