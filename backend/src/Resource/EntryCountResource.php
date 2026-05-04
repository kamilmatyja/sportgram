<?php

namespace App\Resource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EntryCountResource',
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
    public static function fromEntityCollection(array $records): array
    {
        $data = [];

        foreach ($records as $record) {
            $data[] = [
                'entityId' => $record['entityId'],
                'type' => $record['type'],
                'count' => $record['count'],
            ];
        }

        return $data;
    }
}
