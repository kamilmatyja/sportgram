<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::EVENT_DISCIPLINES], nullable: true),
    ],
    type: 'object',
)]
class EventDetailsQueryDto
{
    public const string EVENT_DISCIPLINES = 'eventDisciplines';

    public const string EVENT_DISCIPLINE_DISTANCES = 'eventDisciplineDistances';

    public const string EVENT_DISCIPLINE_SUB_DISTANCES = 'eventDisciplineSubDistances';

    /** @var string[] */
    #[Assert\Choice(choices: [
        self::EVENT_DISCIPLINES,
        self::EVENT_DISCIPLINE_DISTANCES,
        self::EVENT_DISCIPLINE_SUB_DISTANCES,
    ], multiple: true)]
    public array $include = [];
}
