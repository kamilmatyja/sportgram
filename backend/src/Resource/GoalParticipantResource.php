<?php

namespace App\Resource;

use App\Dto\GoalDetailsQueryDto;
use App\Entity\{GoalParticipant, GoalParticipantResult};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'GoalParticipantResource',
    required: [
        'id',
        'goalId',
        'userId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'goalId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'results',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/GoalParticipantResultResource'),
        ),
    ],
    type: 'object',
)]
class GoalParticipantResource
{
    public static function fromEntity(GoalParticipant $goalParticipant, ?GoalDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $goalParticipant->id?->toString(),
            'goalId' => $goalParticipant->goal->id?->toString(),
            'userId' => $goalParticipant->user->id?->toString(),
            'createdAt' => $goalParticipant->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $goalParticipant->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $goalParticipant->status->value,
        ];

        if (in_array($dto::GOAL_PARTICIPANT_RESULTS, $dto->include)) {
            $data['results'] = array_map(
                fn (GoalParticipantResult $result) => GoalParticipantResultResource::fromEntity($result),
                $goalParticipant->results->toArray(),
            );
        }

        return $data;
    }
}
