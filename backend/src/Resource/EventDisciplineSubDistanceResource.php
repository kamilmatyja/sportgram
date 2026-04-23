<?php

namespace App\Resource;

use App\Entity\EventDisciplineSubDistance;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventDisciplineSubDistanceResource',
    required: [
        'id',
        'eventDisciplineDistanceId',
        'createdAt',
        'updatedAt',
        'subDistance',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'eventDisciplineDistanceId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'subDistance', type: 'integer', example: 100),
    ],
    type: 'object',
)]
class EventDisciplineSubDistanceResource
{
    public static function fromEntity(EventDisciplineSubDistance $eventDisciplineSubDistance): array
    {
        return [
            'id' => $eventDisciplineSubDistance->id->toString(),
            'eventDisciplineDistanceId' => $eventDisciplineSubDistance->eventDisciplineDistance->id->toString(),
            'createdAt' => $eventDisciplineSubDistance->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineSubDistance->updatedAt->format('Y-m-d\TH:i:s'),
            'subDistance' => $eventDisciplineSubDistance->subDistance,
        ];
    }
}
