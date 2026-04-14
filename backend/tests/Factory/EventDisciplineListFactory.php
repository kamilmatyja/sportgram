<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineList;
use App\Enum\SaveStatusEnum;

final class EventDisciplineListFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineList
    {
        $defaults = [
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make(),
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDisciplineList(
            $data['eventDisciplineDistance'],
            $data['feed'],
            $data['user'],
            $data['status']
        );
    }
}
