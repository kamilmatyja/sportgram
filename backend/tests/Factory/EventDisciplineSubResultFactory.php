<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineSubResult;

final class EventDisciplineSubResultFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineSubResult
    {
        $defaults = [
            'eventDisciplineSubDistance' => EventDisciplineSubDistanceFactory::make(),
            'user' => UserFactory::make(),
            'time' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDisciplineSubResult(
            $data['eventDisciplineSubDistance'],
            $data['user'],
            $data['time']
        );
    }
}
