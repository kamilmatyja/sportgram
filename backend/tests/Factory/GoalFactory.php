<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Goal;
use App\Enum\{DisciplineEnum, GoalStatusEnum};

final class GoalFactory extends BaseFactory
{
    public static function make(array $overrides = []): Goal
    {
        $defaults = [
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'startedAt' => self::randomData(),
            'endedAt' => self::randomData(),
            'text' => self::randomString('text'),
            'link' => self::randomString('link'),
            'discipline' => self::randomEnum(DisciplineEnum::class),
            'distance' => self::randomInt(),
            'time' => self::randomInt(),
            'status' => self::randomEnum(GoalStatusEnum::class),
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
            $data['status'],
        );
    }
}
