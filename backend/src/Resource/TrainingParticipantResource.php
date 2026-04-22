<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{TrainingDiscipline, TrainingParticipant};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TrainingParticipantResource',
    required: [
        'id',
        'trainingId',
        'userId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'trainingId', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/TrainingParticipantDisciplineResource'),
        ),
    ],
    type: 'object',
)]
class TrainingParticipantResource
{
    public static function fromEntity(TrainingParticipant $trainingParticipant, TrainingDetailsQueryDto $dto): array
    {
        $data = [
            'id' => $trainingParticipant->id->toString(),
            'trainingId' => $trainingParticipant->training->id->toString(),
            'userId' => $trainingParticipant->user->id->toString(),
            'createdAt' => $trainingParticipant->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $trainingParticipant->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $trainingParticipant->status->value,
        ];

        if (in_array($dto::TRAINING_PARTICIPANT_DISCIPLINES, $dto->include)) {
            $data['disciplines'] = array_map(
                fn (TrainingDiscipline $discipline) => TrainingParticipantDisciplineResource::fromEntity(
                    $discipline,
                    $dto,
                ),
                $trainingParticipant->disciplines->toArray(),
            );
        }

        return $data;
    }
}
