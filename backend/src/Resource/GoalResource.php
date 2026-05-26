<?php

namespace App\Resource;

use App\Dto\GoalDetailsQueryDto;
use App\Entity\{Goal, GoalParticipant};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'text',
        'link',
        'discipline',
        'distance',
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
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Running goal'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(ref: new Model(type: GoalParticipantResource::class)),
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
            'userId' => $goal->user->id->toString(),
            'createdAt' => $goal->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $goal->updatedAt->format('Y-m-d\TH:i:s'),
            'startedAt' => $goal->startedAt?->format('Y-m-d\TH:i:s'),
            'endedAt' => $goal->endedAt?->format('Y-m-d\TH:i:s'),
            'text' => $goal->text,
            'link' => $goal->link,
            'discipline' => $goal->discipline->value,
            'distance' => $goal->distance,
            'time' => $goal->time,
            'status' => $goal->status->value,
        ];

        if ($dto && in_array($dto::GOAL_PARTICIPANTS, $dto->include)) {
            $data['participants'] = array_map(
                fn (GoalParticipant $participant) => GoalParticipantResource::fromEntity($participant, $dto),
                $goal->participants->toArray(),
            );
        }

        return $data;
    }

    /** @param Goal[] $goals */
    public static function fromEntityCollection(array $goals): array
    {
        return array_map(fn (Goal $goal) => self::fromEntity($goal), $goals);
    }
}
