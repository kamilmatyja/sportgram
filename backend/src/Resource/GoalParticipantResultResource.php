<?php

namespace App\Resource;

use App\Entity\GoalParticipantResult;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'GoalParticipantResultResource',
    required: [
        'id',
        'goalParticipantId',
        'feedId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'goalParticipantId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'feedId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class GoalParticipantResultResource
{
    public static function fromEntity(GoalParticipantResult $goalParticipantResult): array
    {
        return [
            'id' => $goalParticipantResult->id?->toString(),
            'goalParticipantId' => $goalParticipantResult->goalParticipant->id?->toString(),
            'feedId' => $goalParticipantResult->feed->id?->toString(),
            'createdAt' => $goalParticipantResult->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $goalParticipantResult->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $goalParticipantResult->status->value,
        ];
    }
}
