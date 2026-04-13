<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineSubDistance;

final class EventDisciplineSubDistanceFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineSubDistance
    {
        $defaults = [
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make(),
            'subDistance' => self::uniqueInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDisciplineSubDistance(
            $data['eventDisciplineDistance'],
            $data['subDistance']
        );
    }
}
