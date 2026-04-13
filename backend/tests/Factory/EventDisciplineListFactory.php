<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDisciplineList;
use App\Enum\EventDisciplineListStatusEnum;

final class EventDisciplineListFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDisciplineList
    {
        $defaults = [
            'eventDisciplineDistance' => EventDisciplineDistanceFactory::make(),
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'status' => self::uniqueEnum(EventDisciplineListStatusEnum::class),
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
