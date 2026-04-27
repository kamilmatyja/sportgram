<?php

namespace App\Dto;

use App\Entity\{Goal, User};
use App\Enum\DisciplineEnum;
use App\Validator\{EntityExistsField, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'GoalDto',
    required: ['startedAt', 'endedAt', 'text', 'link', 'discipline', 'distance'],
    properties: [
        new OA\Property(property: 'startedAt', type: 'date', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'endedAt', type: 'date', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'text', type: 'string', example: 'Running goal'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60, nullable: true),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(type: 'string', format: 'uuid'),
            example: ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'],
            nullable: true,
        ),
    ],
    type: 'object',
)]
class GoalDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
    public string $startedAt;

    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
    public string $endedAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $text;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Goal::class, field: 'link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    public int $discipline;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $distance;

    #[Assert\Type('integer')]
    public ?int $time;

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 0)]
    #[Assert\Unique]
    public array $participants = [];
}
