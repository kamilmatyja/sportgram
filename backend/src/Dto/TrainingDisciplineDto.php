<?php

namespace App\Dto;

use App\Enum\DisciplineEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'TrainingDisciplineDto')]
class TrainingDisciplineDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    #[OA\Property(example: 2)]
    public int $discipline;

    /** @var TrainingDisciplineDistanceDto[] */
    #[Assert\Valid]
    #[OA\Property(type: 'array', items: new OA\Items(ref: '#/components/schemas/TrainingDisciplineDistanceDto'))]
    public array $distances = [];
}
