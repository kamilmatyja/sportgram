<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'TrainingDetailsQueryDto')]
class TrainingDetailsQueryDto
{
    public const string TRAINING_PARTICIPANTS = 'trainingParticipants';

    public const string TRAINING_PARTICIPANT_DISCIPLINES = 'trainingParticipantDisciplines';

    public const string TRAINING_PARTICIPANT_DISCIPLINE_DISTANCES = 'trainingParticipantDisciplineDistances';

    public const string TRAINING_PARTICIPANT_DISCIPLINE_SUB_DISTANCES = 'trainingParticipantDisciplineSubDistances';

    #[Assert\Choice(choices: [
        self::TRAINING_PARTICIPANTS,
        self::TRAINING_PARTICIPANT_DISCIPLINES,
        self::TRAINING_PARTICIPANT_DISCIPLINE_DISTANCES,
        self::TRAINING_PARTICIPANT_DISCIPLINE_SUB_DISTANCES,
    ], multiple: true)]
    #[OA\Property(description: 'Include related entities', nullable: true)]
    public array $include = [];
}
