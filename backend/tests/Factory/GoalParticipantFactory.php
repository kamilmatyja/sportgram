<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\GoalParticipant;

final class GoalParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = []): GoalParticipant
    {
        $defaults = [
            'goal' => GoalFactory::make(),
            'user' => UserFactory::make(),
        ];

        $data = array_replace($defaults, $overrides);

        return new GoalParticipant(
            $data['goal'],
            $data['user']
        );
    }
}
