<?php

namespace App\Resource;

use App\Entity\EventDisciplineList;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventDisciplineDistanceListResource',
    required: [
        'id',
        'eventDisciplineDistanceId',
        'feedId',
        'userId',
        'createdAt',
        'updatedAt',
        'status',
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
        new OA\Property(
            property: 'feedId',
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
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class EventDisciplineDistanceListResource
{
    public static function fromEntity(EventDisciplineList $eventDisciplineList): array
    {
        return [
            'id' => $eventDisciplineList->id->toString(),
            'eventDisciplineDistanceId' => $eventDisciplineList->eventDisciplineDistance->id->toString(),
            'feedId' => $eventDisciplineList->feed->id->toString(),
            'userId' => $eventDisciplineList->user->id->toString(),
            'createdAt' => $eventDisciplineList->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineList->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $eventDisciplineList->status->value,
        ];
    }

    public static function fromEntityCollection(array $lists): array
    {
        return array_map(fn (EventDisciplineList $list) => self::fromEntity($list), $lists);
    }
}
