<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::FEED_COMMENTS], nullable: true),
    ],
    type: 'object',
)]
class FeedDetailsQueryDto
{
    public const string FEED_COMMENTS = 'feedComments';

    public const string FEED_REACTIONS = 'feedReactions';

    public const string EVENT_DISCIPLINE_LIST = 'eventDisciplineList';

    public const string EVENT_DISCIPLINE_RESULT = 'eventDisciplineResult';

    public const string GOAL = 'goal';

    public const string GOAL_PARTICIPANT_RESULT = 'goalParticipantResult';

    public const string TRAINING = 'training';

    /** @var string[] */
    #[Assert\Choice(choices: [
        self::FEED_COMMENTS,
        self::FEED_REACTIONS,
        self::EVENT_DISCIPLINE_LIST,
        self::EVENT_DISCIPLINE_RESULT,
        self::GOAL,
        self::GOAL_PARTICIPANT_RESULT,
        self::TRAINING,
    ], multiple: true)]
    public array $include = [];
}
