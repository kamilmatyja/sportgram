<?php

namespace App\Dto;

use App\Enum\DisciplineEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Type;

#[OA\Schema(
    schema: 'TrainingDisciplineDto',
    required: ['discipline'],
    properties: [
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(
                ref: '#/components/schemas/TrainingDisciplineDistanceDto',
            ),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class TrainingDisciplineDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    public int $discipline;

    /** @var TrainingDisciplineDistanceDto[] */
    #[Assert\Valid]
    #[Type('array<App\Dto\TrainingDisciplineDistanceDto>')]
    public array $distances = [];
}
