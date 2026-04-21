<?php

namespace App\Resource;

use App\Dto\GoalDetailsQueryDto;
use App\Entity\{Goal, GoalParticipant};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'GoalResource',
    required: [
        'id',
        'createdAt',
        'updatedAt',
        'text',
        'discipline',
        'distance',
        'time',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Ala ma kota'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(property: 'distance', type: 'integer', example: 1000),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/GoalParticipantResource'),
        ),
    ],
    type: 'object',
)]
class GoalResource
{
    public static function fromEntity(Goal $goal, ?GoalDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $goal->id,
            'text' => $goal->text,
            'discipline' => $goal->discipline,
            'distance' => $goal->distance,
            'time' => $goal->time,
            'status' => $goal->status,
            'createdAt' => $goal->createdAt->format(DATE_ATOM),
            'updatedAt' => $goal->updatedAt->format(DATE_ATOM),
        ];

        if ($dto?->include === $dto::GOAL_PARTICIPANTS || $dto?->include === $dto::GOAL_PARTICIPANT_RESULTS) {
            $data['participants'] = array_map(
                fn (GoalParticipant $participant) => GoalParticipantResource::fromEntity($participant, $dto),
                $goal->participants->toArray(),
            );
        }

        return $data;
    }

    public static function fromEntityCollection(array $goals): array
    {
        return array_map(fn (Goal $goal) => self::fromEntity($goal), $goals);
    }
}
