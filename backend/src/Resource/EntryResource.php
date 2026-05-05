<?php

namespace App\Resource;

use App\Entity\Entry;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'userId',
        'entryId',
        'createdAt',
        'updatedAt',
        'type',
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
        new OA\Property(
            property: 'entryId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
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

    /** @param Entry[] $entries */
    public static function fromEntityCollection(array $entries): array
    {
        return array_map(fn (Entry $entry) => self::fromEntity($entry), $entries);
    }
}
