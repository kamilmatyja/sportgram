<?php

namespace App\Dto;

use App\Enum\DisciplineEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventDisciplineDto',
    required: ['discipline'],
    properties: [
        new OA\Property(property: 'discipline', type: 'integer', example: 1),
        new OA\Property(
            property: 'distances',
            type: 'array',
            items: new OA\Items(
                ref: '#/components/schemas/EventDisciplineDistanceDto',
            ),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventDisciplineDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [DisciplineEnum::class, 'values'])]
    public int $discipline;

    /** @var EventDisciplineDistanceDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $distances = [];

    final public function addDistance(EventDisciplineDistanceDto $distance): void
    {
        $this->distances[] = $distance;
    }
}
