<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineDistance;

final class EventDisciplineDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineDistance
    {
        $defaults = [
            'eventDiscipline' => EventDisciplineFactory::make(),
            'distance' => self::uniqueInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDisciplineDistance(
            $data['eventDiscipline'],
            $data['distance']
        );
    }
}
