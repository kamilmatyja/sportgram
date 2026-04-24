<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineResult;

final class EventDisciplineResultFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineResult
    {
        $defaults = [
            'eventDisciplineList' => EventDisciplineListFactory::make(),
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'time' => self::randomInt(),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDisciplineResult(
            $data['eventDisciplineList'],
            $data['feed'],
            $data['user'],
            $data['time'],
        );
    }
}
