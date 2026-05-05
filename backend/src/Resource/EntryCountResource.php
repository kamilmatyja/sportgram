<?php

namespace App\Resource;

use App\Dto\EntryCountDto;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'entityId',
        'type',
        'count',
    ],
    properties: [
        new OA\Property(
            property: 'entityId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'type', type: 'integer', example: 1),
        new OA\Property(property: 'count', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class EntryCountResource
{
    public static function fromEntity(EntryCountDto $entry): array
    {
        return [
            'entityId' => $entry->entityId->toString(),
            'type' => $entry->type->value,
            'count' => $entry->count,
        ];
    }

    /** @param EntryCountDto[] $entries */
    public static function fromEntityCollection(array $entries): array
    {
        return array_map(fn (EntryCountDto $entry) => self::fromEntity($entry), $entries);
    }
}
