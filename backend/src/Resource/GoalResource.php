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
        new OA\Property(
            property: 'Id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Running goal'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
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
            'id' => $goal->id->toString(),
            'createdAt' => $goal->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $goal->updatedAt->format('Y-m-d\TH:i:s'),
            'text' => $goal->text,
            'discipline' => $goal->discipline->value,
            'distance' => $goal->distance,
            'time' => $goal->time,
            'status' => $goal->status->value,
        ];

        if (in_array($dto::GOAL_PARTICIPANTS, $dto->include)) {
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
