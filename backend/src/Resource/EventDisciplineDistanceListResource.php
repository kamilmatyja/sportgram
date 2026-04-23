<?php

namespace App\Resource;

use App\Entity\EventDisciplineList;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventDisciplineDistanceListResource',
    required: ['id', 'eventId', 'name'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'eventId', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string'),
    ],
    type: 'object',
)]
class EventDisciplineDistanceListResource
{
    public static function fromEntity(EventDisciplineList $list): array
    {
        return [
            'id' => $list->id->toString(),
            'eventId' => $list->event->id->toString(),
            'name' => $list->name,
        ];
    }

    public static function fromEntityCollection(array $lists): array
    {
        return array_map(fn (EventDisciplineList $list) => self::fromEntity($list), $lists);
    }
}
