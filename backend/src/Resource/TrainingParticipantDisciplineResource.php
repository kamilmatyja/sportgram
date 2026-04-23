<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{TrainingDiscipline, TrainingDisciplineDistance};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TrainingParticipantDisciplineResource',
    required: [
        'id',
        'trainingParticipantId',
        'discipline',
    ],
    properties: [
        new OA\Property(
            property: 'Id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'trainingParticipantId',
            type: 'string',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/TrainingParticipantDisciplineDistanceResource'),
        ),
    ],
    type: 'object',
)]
class TrainingParticipantDisciplineResource
{
    public static function fromEntity(TrainingDiscipline $discipline, TrainingDetailsQueryDto $dto): array
    {
        $data = [
            'id' => $discipline->id->toString(),
            'trainingParticipantId' => $discipline->trainingParticipant->id->toString(),
            'discipline' => $discipline->discipline->value,
        ];

        if (in_array($dto::TRAINING_PARTICIPANT_DISCIPLINE_DISTANCES, $dto->include)) {
            $data['distances'] = array_map(
                fn (TrainingDisciplineDistance $distance) => TrainingParticipantDisciplineDistanceResource::fromEntity(
                    $distance,
                    $dto,
                ),
                $discipline->distances->toArray(),
            );
        }

        return $data;
    }
}
