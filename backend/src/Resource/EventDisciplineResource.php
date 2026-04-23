<?php

namespace App\Resource;

use App\Dto\EventDetailsQueryDto;
use App\Entity\Event;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'EventDisciplineResource',
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
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'pageParticipantId', type: 'string', format: 'uuid'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time'),
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time'),
        new OA\Property(property: 'title', type: 'string'),
        new OA\Property(property: 'description', type: 'string'),
        new OA\Property(property: 'link', type: 'string'),
        new OA\Property(property: 'rules', type: 'string'),
        new OA\Property(property: 'photo', type: 'string'),
        new OA\Property(property: 'location', type: 'string'),
        new OA\Property(property: 'status', type: 'integer'),
    ],
    type: 'object',
)]
class EventDisciplineResource
{
    public static function fromEntity(Event $event, ?EventDetailsQueryDto $dto = null): array
    {
        return [
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
    }

    public static function fromEntityCollection(array $events): array
    {
        return array_map(fn (Event $event) => self::fromEntity($event), $events);
    }
}
