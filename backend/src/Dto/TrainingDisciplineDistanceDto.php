<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Type;

#[OA\Schema(
    schema: 'TrainingDisciplineDistanceDto',
    required: ['distance', 'time'],
    properties: [
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(
                ref: '#/components/schemas/TrainingDisciplineSubDistanceDto',
            ),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class TrainingDisciplineDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $distance;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $time;

    /** @var TrainingDisciplineSubDistanceDto[] */
    #[Assert\Valid]
    #[Type('array<App\Dto\TrainingDisciplineSubDistanceDto>')]
    public array $subDistances = [];
}
