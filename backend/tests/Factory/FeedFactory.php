<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Feed;
use App\Enum\ElementStatusEnum;

final class FeedFactory extends BaseFactory
{
    public static function make(array $overrides = []): Feed
    {
        $defaults = [
            'user' => UserFactory::make(),
            'text' => self::randomString('text'),
            'photo' => self::randoBinary(),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Feed(
            $data['user'],
            $data['text'],
            $data['photo'],
            $data['status'],
        );
    }
}
