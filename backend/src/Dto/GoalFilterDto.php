<?php

namespace App\Dto;

use App\Enum\{DisciplineEnum, GoalStatusEnum};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class GoalFilterDto
{
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426655440000')]
    public ?string $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Trening biegowy')]
    public ?string $text;

    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $discipline;

    #[Assert\Range(min: 1, max: 9999999)]
    public ?int $distance;

    #[Assert\Range(min: 1, max: 9999999)]
    #[OA\Property(example: 3600)]
    public ?int $time;

    #[Assert\Choice(callback: [GoalStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
