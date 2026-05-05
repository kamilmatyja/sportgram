<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::GOAL_PARTICIPANTS], nullable: true),
    ],
    type: 'object',
)]
class GoalDetailsQueryDto
{
    public const string GOAL_PARTICIPANTS = 'goalParticipants';

    public const string GOAL_PARTICIPANT_RESULTS = 'goalParticipantResults';

    /** @var string[] */
    #[Assert\Choice(choices: [self::GOAL_PARTICIPANTS, self::GOAL_PARTICIPANT_RESULTS], multiple: true)]
    public array $include = [];
}
