<?php

namespace App\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\{EventDisciplineDistance, EventDisciplineSubDistance};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'eventDisciplineId',
        'createdAt',
        'updatedAt',
        'distance',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'eventDisciplineId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventDisciplineSubDistanceResource::class)),
        ),
    ],
    type: 'object',
)]
class EventDisciplineDistanceResource
{
    public static function fromEntity(
        EventDisciplineDistance $eventDisciplineDistance,
        ?EventDetailsQueryDto $dto = null,
    ): array {
        $data = [
            'id' => $eventDisciplineDistance->id->toString(),
            'eventDisciplineId' => $eventDisciplineDistance->eventDiscipline->id->toString(),
            'createdAt' => $eventDisciplineDistance->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineDistance->updatedAt->format('Y-m-d\TH:i:s'),
            'distance' => $eventDisciplineDistance->distance,
        ];

        if ($dto && in_array($dto::EVENT_DISCIPLINE_SUB_DISTANCES, $dto->include)) {
            $data['subDistances'] = array_map(
                fn (EventDisciplineSubDistance $subDistance) => EventDisciplineSubDistanceResource::fromEntity(
                    $subDistance,
                ),
                $eventDisciplineDistance->subDistances->toArray(),
            );
        }

        return $data;
    }
}
