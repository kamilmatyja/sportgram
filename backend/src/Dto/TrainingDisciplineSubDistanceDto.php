<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'TrainingDisciplineSubDistanceDto')]
class TrainingDisciplineSubDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    #[OA\Property(example: 1000)]
    public int $subDistance;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    #[OA\Property(example: 1800)]
    public int $time;

    #[Assert\Type('integer')]
    #[OA\Property(example: 52)]
    public ?int $lat = null;

    #[Assert\Type('integer')]
    #[OA\Property(example: 21)]
    public ?int $lng = null;

    #[Assert\Type('integer')]
    #[OA\Property(example: 5)]
    public ?int $accuracy = null;

    #[Assert\Type('integer')]
    #[OA\Property(example: 12)]
    public ?int $speed = null;
}
