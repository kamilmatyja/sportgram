<?php

namespace App\Resource;

use App\Entity\EventDisciplineResult;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventDisciplineDistanceSubResultResource',
    required: ['id', 'eventId', 'result'],
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'eventId', type: 'string', format: 'uuid'),
        new OA\Property(property: 'result', type: 'string'),
    ],
    type: 'object',
)]
class EventDisciplineDistanceSubResultResource
{
    public static function fromEntity(EventDisciplineResult $result): array
    {
        return [
            'id' => $result->id->toString(),
            'eventId' => $result->event->id->toString(),
            'result' => $result->result,
        ];
    }

    public static function fromEntityCollection(array $results): array
    {
        return array_map(fn (EventDisciplineResult $result) => self::fromEntity($result), $results);
    }
}
