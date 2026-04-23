<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'TrainingDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::TRAINING_PARTICIPANTS], nullable: true),
    ],
    type: 'object',
)]
class TrainingDetailsQueryDto
{
    public const string TRAINING_PARTICIPANTS = 'trainingParticipants';

    public const string TRAINING_PARTICIPANT_DISCIPLINES = 'trainingParticipantDisciplines';

    public const string TRAINING_PARTICIPANT_DISCIPLINE_DISTANCES = 'trainingParticipantDisciplineDistances';

    public const string TRAINING_PARTICIPANT_DISCIPLINE_SUB_DISTANCES = 'trainingParticipantDisciplineSubDistances';

    /** @var string[] */
    #[Assert\Choice(choices: [
        self::TRAINING_PARTICIPANTS,
        self::TRAINING_PARTICIPANT_DISCIPLINES,
        self::TRAINING_PARTICIPANT_DISCIPLINE_DISTANCES,
        self::TRAINING_PARTICIPANT_DISCIPLINE_SUB_DISTANCES,
    ], multiple: true)]
    public array $include = [];
}
