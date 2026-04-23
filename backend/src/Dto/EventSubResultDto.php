<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventSubResultDto',
    required: ['eventDisciplineSubDistanceId', 'time'],
    properties: [
        new OA\Property(
            property: 'eventDisciplineSubDistanceId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'time', type: 'integer', example: 60),
    ],
    type: 'object',
)]
class EventSubResultDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    public string $eventDisciplineSubDistanceId;

    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $time;
}
