<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::TRAINING_DISCIPLINES], nullable: true),
    ],
    type: 'object',
)]
class TrainingDetailsQueryDto
{
    public const string TRAINING_DISCIPLINES = 'trainingDisciplines';

    public const string TRAINING_DISCIPLINE_DISTANCES = 'trainingDisciplineDistances';

    public const string TRAINING_DISCIPLINE_SUB_DISTANCES = 'trainingDisciplineSubDistances';

    public const string TRAINING_PARTICIPANTS = 'trainingParticipants';

    /** @var string[] */
    #[Assert\Choice(choices: [
        self::TRAINING_DISCIPLINES,
        self::TRAINING_DISCIPLINE_DISTANCES,
        self::TRAINING_DISCIPLINE_SUB_DISTANCES,
        self::TRAINING_PARTICIPANTS,
    ], multiple: true)]
    public array $include = [];
}
