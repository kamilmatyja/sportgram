<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Type;

#[OA\Schema(
    schema: 'EventDisciplineDistanceDto',
    required: ['distance'],
    properties: [
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(
                ref: '#/components/schemas/EventDisciplineSubDistanceDto',
            ),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventDisciplineDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $distance;

    /** @var EventDisciplineSubDistanceDto[] */
    #[Assert\Valid]
    #[Type('array<App\Dto\EventDisciplineSubDistanceDto>')]
    public array $subDistances = [];
}
