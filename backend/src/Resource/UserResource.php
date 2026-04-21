<?php

namespace App\Resource;

use App\Dto\UserDetailsQueryDto;
use App\Entity\{User, UserDiscipline};
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'UserResource',
    required: [
        'id',
        'createdAt',
        'updatedAt',
        'birthAt',
        'firstName',
        'lastName',
        'gender',
        'phone',
        'email',
        'link',
        'language',
        'country',
        'theme',
        'color',
        'profilePhoto',
        'backgroundPhoto',
        'bio',
        'status',
    ],
    properties: [
        new OA\Property(property: 'id', type: 'string', example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'),
        new OA\Property(property: 'createdAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'updatedAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'birthAt', type: 'string', format: 'date', example: '2024-01-01T21:37:00'),
        new OA\Property(property: 'firstName', type: 'string', example: 'Jan'),
        new OA\Property(property: 'lastName', type: 'string', example: 'Kowalski'),
        new OA\Property(property: 'gender', type: 'integer', example: 1),
        new OA\Property(property: 'phone', type: 'integer', example: 123456789),
        new OA\Property(property: 'email', type: 'string', example: 'jan.kowalski@example.com'),
        new OA\Property(property: 'link', type: 'string', example: 'jan-kowalski'),
        new OA\Property(property: 'language', type: 'integer', example: 1),
        new OA\Property(property: 'country', type: 'integer', example: 1),
        new OA\Property(property: 'theme', type: 'integer', example: 1),
        new OA\Property(property: 'color', type: 'integer', example: 1),
        new OA\Property(property: 'profilePhoto', type: 'string', format: 'byte'),
        new OA\Property(property: 'backgroundPhoto', type: 'string', format: 'byte'),
        new OA\Property(property: 'bio', type: 'string'),
        new OA\Property(property: 'status', type: 'integer', example: 1),
        new OA\Property(property: 'roles', type: 'integer', example: 1),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/DisciplineResource'),
        ),
    ],
    type: 'object',
)]
class UserResource
{
    public static function fromEntity(User $user, ?UserDetailsQueryDto $dto = null): array
    {
        $data = [
            'id' => $user->id?->toString(),
            'createdAt' => $user->createdAt->format('Y-m-d\TH:i:s'),
            'updatedAt' => $user->updatedAt->format('Y-m-d\TH:i:s'),
            'birthAt' => $user->birthAt->format('Y-m-d\TH:i:s'),
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'gender' => $user->gender->value,
            'phone' => $user->phone,
            'email' => $user->email,
            'link' => $user->link,
            'language' => $user->language->value,
            'country' => $user->country->value,
            'theme' => $user->theme->value,
            'color' => $user->color->value,
            'profilePhoto' => $user->profilePhoto,
            'backgroundPhoto' => $user->backgroundPhoto,
            'bio' => $user->bio,
            'status' => $user->status,
        ];

        if ($dto?->include === $dto::USER_DISCIPLINES) {
            $data['disciplines'] = array_map(
                fn (UserDiscipline $discipline) => DisciplineResource::fromEntity($discipline),
                $user->disciplines->toArray(),
            );
        }

        return $data;
    }

    public static function fromEntityCollection(array $users): array
    {
        return array_map(fn (User $user) => self::fromEntity($user), $users);
    }
}
