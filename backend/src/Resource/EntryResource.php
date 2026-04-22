<?php

namespace App\Resource;

use App\Entity\Entry;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EntryResource',
    required: [
        'id',
        'senderUserId',
        'receiverUserId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'entryId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'type', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class EntryResource
{
    public static function fromEntity(Entry $entry): array
    {
        return [
            'id' => $entry->id->toString(),
            'userId' => $entry->user->id->toString(),
            'entityId' => $entry->entityId->toString(),
            'createdAt' => $entry->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $entry->updatedAt->format('Y-m-d\TH:i:s'),
            'type' => $entry->type->value,
        ];
    }

    public static function fromEntityCollection(array $entries): array
    {
        return array_map(fn (Entry $entry) => self::fromEntity($entry), $entries);
    }
}
