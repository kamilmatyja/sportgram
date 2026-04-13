<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Training;
use App\Enum\ElementStatusEnum;

final class TrainingFactory extends BaseFactory
{
    public static function make(array $overrides = []): Training
    {
        $defaults = [
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'startedAt' => self::randomData(),
            'endedAt' => self::randomData(),
            'title' => self::randomString('title'),
            'description' => self::randomString('description'),
            'link' => self::randomString('link'),
            'location' => self::randomString('location'),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Training(
            $data['feed'],
            $data['user'],
            $data['startedAt'],
            $data['endedAt'],
            $data['title'],
            $data['description'],
            $data['link'],
            $data['location'],
            $data['status']
        );
    }
}
