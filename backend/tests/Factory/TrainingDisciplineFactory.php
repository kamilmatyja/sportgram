<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingDiscipline;
use App\Enum\DisciplineEnum;

final class TrainingDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = []): TrainingDiscipline
    {
        $defaults = [
            'trainingParticipant' => TrainingParticipantFactory::make(),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new TrainingDiscipline(
            $data['trainingParticipant'],
            $data['discipline'],
        );
    }
}
