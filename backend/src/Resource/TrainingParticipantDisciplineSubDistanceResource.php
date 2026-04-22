<?php

namespace App\Resource;

use App\Entity\TrainingDisciplineSubDistance;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TrainingParticipantDisciplineSubDistanceResource',
    required: [
        'id',
        'trainingDisciplineDistanceId',
        'subDistance',
        'time',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(
            property: 'trainingDisciplineDistanceId',
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000',
        ),
        new OA\Property(property: 'subDistance', type: 'integer', example: 1),
        new OA\Property(property: 'time', type: 'integer', example: 1),
        new OA\Property(property: 'lat', type: 'number', example: 1),
        new OA\Property(property: 'lng', type: 'number', example: 1),
        new OA\Property(property: 'accuracy', type: 'number', example: 1),
        new OA\Property(property: 'speed', type: 'number', example: 1),
    ],
    type: 'object',
)]
class TrainingParticipantDisciplineSubDistanceResource
{
    public static function fromEntity(TrainingDisciplineSubDistance $subDistance): array
    {
        return [
            'id' => $subDistance->id->toString(),
            'trainingDisciplineDistanceId' => $subDistance->trainingDisciplineDistance->id->toString(),
            'subDistance' => $subDistance->subDistance,
            'time' => $subDistance->time,
            'lat' => $subDistance->lat,
            'lng' => $subDistance->lng,
            'accuracy' => $subDistance->accuracy,
            'speed' => $subDistance->speed,
        ];
    }
}
