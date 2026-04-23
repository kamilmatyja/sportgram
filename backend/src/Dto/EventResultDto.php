<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventResultDto',
    required: ['eventId', 'result'],
    properties: [
        new OA\Property(property: 'eventId', type: 'string', format: 'uuid'),
        new OA\Property(property: 'result', type: 'string', example: '01:23:45'),
    ],
    type: 'object',
)]
class EventResultDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    public string $eventId;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 64)]
    public string $result;
}
