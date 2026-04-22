<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'TrainingDisciplineDistanceDto')]
class TrainingDisciplineDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    #[OA\Property(example: 1000)]
    public int $distance;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    #[OA\Property(example: 1800)]
    public int $time;

    /** @var TrainingDisciplineSubDistanceDto[] */
    #[Assert\Valid]
    #[OA\Property(type: 'array', items: new OA\Items(ref: '#/components/schemas/TrainingDisciplineSubDistanceDto'))]
    public array $subDistances = [];
}
