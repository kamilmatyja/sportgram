<?php

namespace App\Resource;

use App\Entity\UserDiscipline;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'DisciplineResource',
    required: ['id', 'discipline'],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
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
            'discipline' => $discipline->discipline->value,
        ];
    }
}
