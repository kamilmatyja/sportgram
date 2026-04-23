<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [], nullable: true),
    ],
    type: 'object',
)]
class EventDetailsQueryDto
{
    /** @var string[] */
    #[Assert\Choice(choices: [], multiple: true)]
    public array $include = [];
}
