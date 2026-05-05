<?php

namespace App\Resource;

use App\Dto\{EventListDetailsQueryDto};
use App\Entity\{EventDisciplineResult, EventDisciplineSubResult};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'eventDisciplineListId',
        'feedId',
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
            property: 'eventDisciplineListId',
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
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subResults',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventDisciplineDistanceSubResultResource::class)),
        ),
    ],
    type: 'object',
)]
class EventDisciplineDistanceResultResource
{
    public static function fromEntity(
        EventDisciplineResult $eventDisciplineResult,
        ?EventListDetailsQueryDto $dto = null,
    ): array {
        $userId = $eventDisciplineResult->user->id->toString();

        $data = [
            'id' => $eventDisciplineResult->id->toString(),
            'eventDisciplineListId' => $eventDisciplineResult->eventDisciplineList->id->toString(),
            'feedId' => $eventDisciplineResult->feed->id->toString(),
            'userId' => $userId,
            'createdAt' => $eventDisciplineResult->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $eventDisciplineResult->updatedAt->format('Y-m-d\TH:i:s'),
            'time' => $eventDisciplineResult->time,
        ];

        if ($dto && in_array($dto::EVENT_LIST_SUB_RESULTS, $dto->include)) {
            $data['subResults'] = array_map(
                fn (EventDisciplineSubResult $subResult) => EventDisciplineDistanceSubResultResource::fromEntity(
                    $subResult,
                ),
                $eventDisciplineResult->subResults->toArray(),
            );
        }

        return $data;
    }
}
