<?php

namespace App\Resource;

use App\Dto\EventListDetailsQueryDto;
use App\Entity\{EventDisciplineList, EventDisciplineResult};
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
        new OA\Property(
            property: 'results',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/EventDisciplineDistanceResultResource'),
        ),
    ],
    type: 'object',
)]
class EventDisciplineDistanceListResource
{
    public static function fromEntity(
        EventDisciplineList $eventDisciplineList,
        ?EventListDetailsQueryDto $dto = null,
    ): array {
        $data = [
            'id' => $eventDisciplineList->id->toString(),
            'eventDisciplineDistanceId' => $eventDisciplineList->eventDisciplineDistance->id->toString(),
            'feedId' => $eventDisciplineList->feed->id->toString(),
            'userId' => $eventDisciplineList->user->id->toString(),
            'createdAt' => $eventDisciplineList->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineList->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $eventDisciplineList->status->value,
        ];

        if (in_array($dto::EVENT_LIST_RESULTS, $dto->include)) {
            $data['results'] = array_map(
                fn (EventDisciplineResult $result) => EventDisciplineDistanceResultResource::fromEntity($result, $dto),
                $eventDisciplineList->results->toArray(),
            );
        }

        return $data;
    }

    public static function fromEntityCollection(array $lists): array
    {
        return array_map(fn (EventDisciplineList $list) => self::fromEntity($list), $lists);
    }
}
