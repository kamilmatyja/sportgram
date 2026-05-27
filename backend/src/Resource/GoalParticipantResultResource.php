<?php

namespace App\Resource;

use App\Entity\GoalParticipantResult;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'goalParticipantId',
        'feedId',
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
            property: 'goalParticipantId',
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
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class GoalParticipantResultResource
{
    public static function fromEntity(GoalParticipantResult $goalParticipantResult): array
    {
        return [
            'id' => $goalParticipantResult->id->toString(),
            'goalParticipantId' => $goalParticipantResult->goalParticipant->id->toString(),
            'feedId' => $goalParticipantResult->feed->id->toString(),
            'createdAt' => $goalParticipantResult->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $goalParticipantResult->updatedAt->format('Y-m-d\TH:i:s'),
            'distance' => $goalParticipantResult->distance,
            'time' => $goalParticipantResult->time,
            'status' => $goalParticipantResult->status->value,
        ];
    }
}
