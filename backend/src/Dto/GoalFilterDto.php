<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{DisciplineEnum, GoalStatusEnum};
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'GoalFilterDto',
    required: ['userId'],
    properties: [
        new OA\Property(
            property: 'userId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'text', type: 'string', example: 'Running goal', nullable: true),
        new OA\Property(property: 'discipline', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'distance', type: 'integer', example: 100, nullable: true),
        new OA\Property(property: 'time', type: 'integer', example: 60, nullable: true),
        new OA\Property(property: 'status', type: 'integer', example: 1, nullable: true),
    ],
    type: 'object',
)]
class GoalFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    public string $userId;

    #[Assert\Length(min: 1, max: 2048)]
    public ?string $text;

    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    public ?int $discipline;

    #[Assert\Type('integer')]
    public ?int $distance;

    #[Assert\Type('integer')]
    public ?int $time;

    #[Assert\Choice(callback: [GoalStatusEnum::class, 'values'])]
    public ?int $status = null;
}
