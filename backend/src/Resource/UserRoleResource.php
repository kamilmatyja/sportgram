<?php

namespace App\Resource;

use App\Entity\UserRole;
use OpenApi\Attributes as OA;

#[OA\Schema(
    required: [
        'id',
        'userId',
        'createdAt',
        'updatedAt',
        'role',
    ],
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
        new OA\Property(property: 'createdAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'role', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class UserRoleResource
{
    public static function fromEntity(UserRole $role): array
    {
        return [
            'id' => $role->id->toString(),
            'userId' => $role->user->id->toString(),
            'createdAt' => $role->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $role->updatedAt->format('Y-m-d\TH:i:s'),
            'role' => $role->role->value,
        ];
    }
}
