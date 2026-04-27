<?php

namespace App\Resource;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'StatisticResource',
    required: ['userId', 'createdAt', 'discipline', 'distance', 'time'],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
    ],
    type: 'object',
)]
class StatisticResource
{
    public static function fromEntityCollection(array $records): array
    {
        $data = [];

        foreach ($records as $record) {
            $data[] = [
                'userId' => $record['user_id'],
                'createdAt' => $record['created_at'],
                'discipline' => $record['discipline'],
                'distance' => $record['distance'],
                'time' => $record['time'],
            ];
        }

        return $data;
    }
}
