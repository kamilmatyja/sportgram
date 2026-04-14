<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingParticipant;
use App\Enum\ParticipantStatusEnum;

final class TrainingParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = []): TrainingParticipant
    {
        $defaults = [
            'training' => TrainingFactory::make(),
            'user' => UserFactory::make(),
            'status' => self::randomEnum(ParticipantStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new TrainingParticipant(
            $data['training'],
            $data['user'],
            $data['status']
        );
    }
}
