<?php

namespace App\Dto;

use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['distance', 'time'],
    properties: [
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingDisciplineSubDistanceDto::class)),
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
    public ?int $time = null;

    /** @var TrainingDisciplineSubDistanceDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $subDistances = [];

    final public function addSubDistance(TrainingDisciplineSubDistanceDto $subDistance): void
    {
        $this->subDistances[] = $subDistance;
    }
}
