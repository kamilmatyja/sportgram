<?php

namespace App\Dto;

use App\Entity\{Goal, User};
use App\Enum\DisciplineEnum;
use App\Validator\{EntityExistsField, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class GoalDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d')]
    #[OA\Property(example: '2000-01-01')]
    public string $startedAt;

    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d')]
    #[OA\Property(example: '2000-01-01')]
    public string $endedAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Trening biegowy')]
    public string $text;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Goal::class, field: 'link')]
    #[OA\Property(example: 'my-link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $discipline;

    #[Assert\NotBlank]
    #[Assert\Range(min: 1, max: 9999999)]
    public int $distance;

    #[Assert\Range(min: 1, max: 9999999)]
    #[OA\Property(example: 3600)]
    public ?int $time;

    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    #[OA\Property(example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000'])]
    public array $participants = [];
}
