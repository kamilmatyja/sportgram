<?php

namespace App\Resource;

use App\Entity\UserDiscipline;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: ['id', 'userId', 'discipline'],
    properties: [
        new OA\Property(
            property: 'id',
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
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class UserDisciplineResource
{
    public static function fromEntity(UserDiscipline $discipline): array
    {
        return [
            'id' => $discipline->id->toString(),
            'userId' => $discipline->user->id->toString(),
            'discipline' => $discipline->discipline->value,
        ];
    }
}
