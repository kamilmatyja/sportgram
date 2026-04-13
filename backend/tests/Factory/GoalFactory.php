<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Goal;
use App\Enum\DisciplineEnum;
use App\Enum\GoalStatusEnum;

final class GoalFactory extends BaseFactory
{
    public static function make(array $overrides = []): Goal
    {
        $defaults = [
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'startedAt' => self::uniqueDate(),
            'endedAt' => self::uniqueDate(),
            'text' => self::uniqueString('text'),
            'link' => self::uniqueString('link'),
            'discipline' => self::uniqueEnum(DisciplineEnum::class),
            'distance' => self::uniqueInt(),
            'time' => self::uniqueInt(),
            'status' => self::uniqueEnum(GoalStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Goal(
            $data['feed'],
            $data['user'],
            $data['startedAt'],
            $data['endedAt'],
            $data['text'],
            $data['link'],
            $data['discipline'],
            $data['distance'],
            $data['time'],
            $data['status']
        );
    }
}
