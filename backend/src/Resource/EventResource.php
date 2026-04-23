<?php

namespace App\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\{Event, EventDiscipline};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventResource',
    required: [
        'id',
        'pageParticipantId',
        'createdAt',
        'updatedAt',
        'startedAt',
        'endedAt',
        'title',
        'description',
        'link',
        'rules',
        'photo',
        'location',
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
            property: 'pageParticipantId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'title', type: 'string', example: 'Event title'),
        new OA\Property(property: 'description', type: 'string', example: 'Event description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'rules', type: 'string', example: 'Event rules'),
        new OA\Property(property: 'photo', type: 'string', example: 'base64string'),
        new OA\Property(property: 'location', type: 'string', example: 'Event location'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/EventDisciplineResource'),
        ),
    ],
    type: 'object',
)]
class EventResource
{
    public static function fromEntity(Event $event, ?EventDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $event->id->toString(),
            'pageParticipantId' => $event->pageParticipant->id->toString(),
            'createdAt' => $event->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $event->updatedAt->format('Y-m-d\TH:i:s'),
            'startedAt' => $event->startedAt->format('Y-m-d\TH:i:s'),
            'endedAt' => $event->endedAt->format('Y-m-d\TH:i:s'),
            'title' => $event->title,
            'description' => $event->description,
            'link' => $event->link,
            'rules' => $event->rules,
            'photo' => $event->photo,
            'location' => $event->location,
            'status' => $event->status->value,
        ];

        if (in_array($dto::EVENT_DISCIPLINES, $dto->include)) {
            $data['disciplines'] = array_map(
                fn (EventDiscipline $discipline) => EventDisciplineResource::fromEntity($discipline, $dto),
                $event->disciplines->toArray(),
            );
        }

        return $data;
    }

    public static function fromEntityCollection(array $events): array
    {
        return array_map(fn (Event $event) => self::fromEntity($event), $events);
    }
}
