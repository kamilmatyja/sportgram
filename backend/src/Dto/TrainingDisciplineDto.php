<?php

namespace App\Dto;

use App\Enum\DisciplineEnum;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['discipline'],
    properties: [
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingDisciplineDistanceDto::class)),
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
    #[Assert\Type('array')]
    public array $distances = [];

    final public function addDistance(TrainingDisciplineDistanceDto $distance): void
    {
        $this->distances[] = $distance;
    }
}
