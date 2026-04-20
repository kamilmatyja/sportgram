<?php

namespace App\Resource;

use App\Entity\{Story};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'StoryResource',
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'text',
        'photo',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-02'),
        new OA\Property(property: 'text', type: 'string', example: 'Ala ma kota'),
        new OA\Property(property: 'photo', type: 'string', format: 'byte'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class StoryResource
{
    public static function fromEntity(Story $story): array
    {
        return [
            'id' => $story->id?->toString(),
            'userId' => $story->user->id?->toString(),
            'createdAt' => $story->createdAt->format('Y-m-d'),
            'updatedAt' => $story->updatedAt->format('Y-m-d'),
            'text' => $story->text,
            'photo' => $story->photo,
            'status' => $story->status,
        ];
    }

    public static function fromEntityCollection(array $stories): array
    {
        return array_map(fn (Story $story) => self::fromEntity($story), $stories);
    }
}
