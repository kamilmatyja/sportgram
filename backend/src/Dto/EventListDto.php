<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventListDto',
    required: ['eventId', 'name'],
    properties: [
        new OA\Property(property: 'eventId', type: 'string', format: 'uuid'),
        new OA\Property(property: 'name', type: 'string', example: 'Lista startowa'),
    ],
    type: 'object',
)]
class EventListDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    public string $eventId;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 256)]
    public string $name;
}
