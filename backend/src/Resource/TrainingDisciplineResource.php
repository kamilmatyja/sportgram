<?php

namespace App\Resource;

use App\Dto\TrainingDetailsQueryDto;
use App\Entity\{TrainingDiscipline, TrainingDisciplineDistance};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'trainingId',
        'createdAt',
        'updatedAt',
        'discipline',
    ],
    properties: [
        new OA\Property(
            property: 'id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'trainingId',
            type: 'string',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2026-04-22T10:00:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2026-04-22T12:00:00'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingDisciplineDistanceResource::class)),
        ),
    ],
    type: 'object',
)]
class TrainingDisciplineResource
{
    public static function fromEntity(TrainingDiscipline $discipline, TrainingDetailsQueryDto $dto): array
    {
        $data = [
            'id' => $discipline->id->toString(),
            'trainingId' => $discipline->training->id->toString(),
            'createdAt' => $discipline->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $discipline->updatedAt->format('Y-m-d\TH:i:s'),
            'discipline' => $discipline->discipline->value,
        ];

        if (in_array($dto::TRAINING_DISCIPLINE_DISTANCES, $dto->include)) {
            $data['distances'] = array_map(
                fn (TrainingDisciplineDistance $distance) => TrainingDisciplineDistanceResource::fromEntity(
                    $distance,
                    $dto,
                ),
                $discipline->distances->toArray(),
            );
        }

        return $data;
    }
}
