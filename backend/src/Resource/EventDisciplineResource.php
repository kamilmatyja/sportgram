<?php

namespace App\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\{EventDiscipline, EventDisciplineDistance};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'eventId',
        'createdAt',
        'updatedAt',
        'discipline',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'eventId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventDisciplineDistanceResource::class)),
        ),
    ],
    type: 'object',
)]
class EventDisciplineResource
{
    public static function fromEntity(EventDiscipline $eventDiscipline, ?EventDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $eventDiscipline->id->toString(),
            'pageParticipantId' => $eventDiscipline->event->id->toString(),
            'createdAt' => $eventDiscipline->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDiscipline->updatedAt->format('Y-m-d\TH:i:s'),
            'discipline' => $eventDiscipline->discipline->value,
        ];

        if ($dto && in_array($dto::EVENT_DISCIPLINE_DISTANCES, $dto->include)) {
            $data['distances'] = array_map(
                fn (EventDisciplineDistance $distance) => EventDisciplineDistanceResource::fromEntity($distance, $dto),
                $eventDiscipline->distances->toArray(),
            );
        }

        return $data;
    }
}
