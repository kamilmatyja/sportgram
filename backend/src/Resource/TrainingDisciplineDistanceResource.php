<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{TrainingDisciplineDistance, TrainingDisciplineSubDistance};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TrainingDisciplineDistanceResource',
    required: [
        'id',
        'trainingDisciplineId',
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
            property: 'trainingDisciplineId',
            type: 'string',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/TrainingDisciplineSubDistanceResource'),
        ),
    ],
    type: 'object',
)]
class TrainingDisciplineDistanceResource
{
    public static function fromEntity(TrainingDisciplineDistance $distance, TrainingDetailsQueryDto $dto): array
    {
        $data = [
            'id' => $distance->id->toString(),
            'trainingDisciplineId' => $distance->trainingDiscipline->id->toString(),
            'distance' => $distance->distance,
            'time' => $distance->time,
        ];

        if (in_array($dto::TRAINING_DISCIPLINES, $dto->include)) {
            $data['subDistances'] = array_map(
                fn (
                    TrainingDisciplineSubDistance $subDistance,
                ) => TrainingDisciplineSubDistanceResource::fromEntity($subDistance),
                $distance->subDistances->toArray(),
            );
        }

        return $data;
    }
}
