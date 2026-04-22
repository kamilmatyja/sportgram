<?php

namespace App\Resource;

use App\Entity\FeedComment;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FeedCommentResource',
    required: [
        'id',
        'feedId',
        'userId',
        'createdAt',
        'updatedAt',
        'text',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'feedId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Ala ma kota'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class FeedCommentResource
{
    public static function fromEntity(FeedComment $feedComment): array
    {
        return [
            'id' => $feedComment->id->toString(),
            'feedId' => $feedComment->feed->id->toString(),
            'userId' => $feedComment->user->id->toString(),
            'createdAt' => $feedComment->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $feedComment->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $feedComment->text,
            'status' => $feedComment->status->value,
        ];
    }
}
