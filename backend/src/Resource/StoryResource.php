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
        new OA\Property(
            property: 'Id',
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
        new OA\Property(property: 'text', type: 'string', example: 'Story text'),
        new OA\Property(property: 'photo', type: 'string', format: 'base64string'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class StoryResource
{
    public static function fromEntity(Story $story): array
    {
        return [
            'id' => $story->id->toString(),
            'userId' => $story->user->id->toString(),
            'createdAt' => $story->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $story->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $story->text,
            'photo' => $story->photo,
            'status' => $story->status->value,
        ];
    }

    public static function fromEntityCollection(array $stories): array
    {
        return array_map(fn (Story $story) => self::fromEntity($story), $stories);
    }
}
