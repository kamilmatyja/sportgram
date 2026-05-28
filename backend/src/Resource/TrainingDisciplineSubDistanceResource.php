<?php

namespace App\Resource;

use App\Entity\TrainingDisciplineSubDistance;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'trainingDisciplineDistanceId',
        'createdAt',
        'updatedAt',
        'subDistance',
        'time',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'trainingDisciplineDistanceId',
            type: 'string',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'subDistance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(property: 'lat', type: 'number', example: 52),
        new OA\Property(property: 'lng', type: 'number', example: 21),
        new OA\Property(property: 'accuracy', type: 'number', example: 5),
        new OA\Property(property: 'speed', type: 'number', example: 12),
    ],
    type: 'object',
)]
class TrainingDisciplineSubDistanceResource
{
    public static function fromEntity(TrainingDisciplineSubDistance $subDistance): array
    {
        return [
            'id' => $subDistance->id->toString(),
            'trainingDisciplineDistanceId' => $subDistance->trainingDisciplineDistance->id->toString(),
            'createdAt' => $subDistance->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $subDistance->updatedAt->format('Y-m-d\TH:i:s'),
            'subDistance' => $subDistance->subDistance,
            'time' => $subDistance->time,
            'lat' => $subDistance->lat,
            'lng' => $subDistance->lng,
            'accuracy' => $subDistance->accuracy,
            'speed' => $subDistance->speed,
        ];
    }
}
