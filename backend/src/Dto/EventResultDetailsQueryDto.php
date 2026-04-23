<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventResultDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::EVENT_SUB_RESULTS], nullable: true),
    ],
    type: 'object',
)]
class EventResultDetailsQueryDto
{
    public const string EVENT_SUB_RESULTS = 'eventSubResult';

    /** @var string[] */
    #[Assert\Choice(choices: [self::EVENT_SUB_RESULTS], multiple: true)]
    public array $include = [];
}
