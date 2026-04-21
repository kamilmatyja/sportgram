<?php

namespace App\Resource;

use App\Entity\UserRole;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'UserRoleResource',
    required: ['id', 'userId', 'role'],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'userId', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000'),
        new OA\Property(property: 'role', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class UserRoleResource
{
    public static function fromEntity(UserRole $role): array
    {
        return [
            'id' => $role->id?->toString(),
            'userId' => $role->user->id?->toString(),
            'role' => $role->role->value,
        ];
    }
}
