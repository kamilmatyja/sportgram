<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'GoalDetailsQueryDto')]
class GoalDetailsQueryDto
{
    public const string GOAL_PARTICIPANTS = 'goalParticipants';

    public const string GOAL_PARTICIPANT_RESULTS = 'goalParticipantResults';

    #[Assert\Choice(choices: [self::GOAL_PARTICIPANTS, self::GOAL_PARTICIPANT_RESULTS], multiple: true)]
    #[OA\Property(description: 'Include related entities', nullable: true)]
    public array $include = [];
}
