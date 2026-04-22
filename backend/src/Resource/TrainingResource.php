<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{Training, TrainingParticipant};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TrainingResource',
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'startedAt',
        'endedAt',
        'title',
        'description',
        'link',
        'location',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'startedAt', type: 'string', format: 'date', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'title', type: 'string', example: 'Morning Run'),
        new OA\Property(property: 'description', type: 'string', example: 'A nice training session.'),
        new OA\Property(property: 'link', type: 'string', example: 'morning-run'),
        new OA\Property(property: 'location', type: 'string', example: 'Central Park'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/TrainingParticipantResource'),
        ),
    ],
    type: 'object',
)]
class TrainingResource
{
    public static function fromEntity(Training $training, ?TrainingDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $training->id->toString(),
            'userId' => $training->user->id->toString(),
            'createdAt' => $training->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $training->updatedAt->format('Y-m-d\TH:i:s'),
            'startedAt' => $training->startedAt->format('Y-m-d\TH:i:s'),
            'endedAt' => $training->endedAt->format('Y-m-d\TH:i:s'),
            'title' => $training->title,
            'description' => $training->description,
            'link' => $training->link,
            'location' => $training->location,
            'status' => $training->status->value,
        ];

        if (in_array($dto::TRAINING_PARTICIPANTS, $dto->include)) {
            $data['participants'] = array_map(
                fn (TrainingParticipant $participant) => TrainingParticipantResource::fromEntity($participant, $dto),
                $training->participants->toArray(),
            );
        }

        return $data;
    }

    public static function fromEntityCollection(array $trainings): array
    {
        return array_map(fn (Training $training) => self::fromEntity($training), $trainings);
    }
}
