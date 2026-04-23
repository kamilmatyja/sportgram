<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventDisciplineSubDistanceDto',
    required: ['subDistance'],
    properties: [
        new OA\Property(property: 'subDistance', type: 'integer', example: 100),
    ],
    type: 'object',
)]
class EventDisciplineSubDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $subDistance;
}
