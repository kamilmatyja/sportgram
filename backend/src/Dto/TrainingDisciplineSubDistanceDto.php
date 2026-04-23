<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'TrainingDisciplineSubDistanceDto',
    required: ['subDistance', 'time'],
    properties: [
        new OA\Property(property: 'subDistance', type: 'integer', example: 100),
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(property: 'lat', type: 'integer', example: 52, nullable: true),
        new OA\Property(property: 'lng', type: 'integer', example: 21, nullable: true),
        new OA\Property(property: 'accuracy', type: 'integer', example: 5, nullable: true),
        new OA\Property(property: 'speed', type: 'integer', example: 12, nullable: true),
    ],
    type: 'object',
)]
class TrainingDisciplineSubDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $subDistance;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $time;

    #[Assert\Type('integer')]
    public ?int $lat = null;

    #[Assert\Type('integer')]
    public ?int $lng = null;

    #[Assert\Type('integer')]
    public ?int $accuracy = null;

    #[Assert\Type('integer')]
    public ?int $speed = null;
}
