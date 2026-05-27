<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::EVENT_LIST_RESULTS], nullable: true),
    ],
    type: 'object',
)]
class EventListDetailsQueryDto
{
    public const string EVENT_LIST_RESULTS = 'eventListResults';

    public const string EVENT_LIST_SUB_RESULTS = 'eventListSubResults';

    /** @var string[] */
    #[Assert\Choice(choices: [
        self::EVENT_LIST_RESULTS,
        self::EVENT_LIST_SUB_RESULTS,
    ], multiple: true)]
    public array $include = [];
}
