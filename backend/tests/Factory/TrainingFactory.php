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
            'startedAt' => self::uniqueDate(),
            'endedAt' => self::uniqueDate(),
            'title' => self::uniqueString('title'),
            'description' => self::uniqueString('description'),
            'link' => self::uniqueString('link'),
            'location' => self::uniqueString('location'),
            'status' => self::uniqueEnum(ElementStatusEnum::class),
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
