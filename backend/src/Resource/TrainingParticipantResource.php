<?php

namespace App\Resource;

use App\Entity\{TrainingParticipant};
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'trainingId',
        'userId',
        'createdAt',
        'updatedAt',
        'status',
    ],
    properties: [
        new OA\Property(
            property: 'Id',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(
            property: 'trainingId',
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
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class TrainingParticipantResource
{
    public static function fromEntity(TrainingParticipant $trainingParticipant): array
    {
        return [
            'id' => $trainingParticipant->id->toString(),
            'trainingId' => $trainingParticipant->training->id->toString(),
            'userId' => $trainingParticipant->user->id->toString(),
            'createdAt' => $trainingParticipant->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $trainingParticipant->updatedAt->format('Y-m-d\TH:i:s'),
            'status' => $trainingParticipant->status->value,
        ];
    }
}
