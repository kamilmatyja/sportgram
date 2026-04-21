<?php

namespace App\Resource;

use App\Entity\UserDiscipline;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'DisciplineResource',
    required: ['id', 'userId', 'discipline'],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class DisciplineResource
{
    public static function fromEntity(UserDiscipline $discipline): array
    {
        return [
            'id' => $discipline->id?->toString(),
            'userId' => $discipline->user->id?->toString(),
            'discipline' => $discipline->discipline->value,
        ];
    }
}
