<?php

namespace App\Resource;

use App\Entity\EventDisciplineSubResult;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'eventDisciplineSubDistanceId',
        'eventDisciplineResultId',
        'userId',
        'createdAt',
        'updatedAt',
        'time',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'eventDisciplineSubDistanceId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'eventDisciplineResultId',
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
        new OA\Property(property: 'time', type: 'integer', example: 60),
    ],
    type: 'object',
)]
class EventDisciplineDistanceSubResultResource
{
    public static function fromEntity(EventDisciplineSubResult $eventDisciplineSubResult): array
    {
        return [
            'id' => $eventDisciplineSubResult->id->toString(),
            'eventDisciplineSubDistanceId' => $eventDisciplineSubResult->eventDisciplineSubDistance->id->toString(),
            'eventDisciplineResultId' => $eventDisciplineSubResult->eventDisciplineResult->id->toString(),
            'userId' => $eventDisciplineSubResult->user->id->toString(),
            'createdAt' => $eventDisciplineSubResult->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineSubResult->updatedAt->format('Y-m-d\TH:i:s'),
            'time' => $eventDisciplineSubResult->time,
        ];
    }
}
