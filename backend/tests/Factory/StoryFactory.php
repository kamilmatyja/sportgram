<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Story;
use App\Enum\ElementStatusEnum;

final class StoryFactory extends BaseFactory
{
    public static function make(array $overrides = []): Story
    {
        $defaults = [
            'user' => UserFactory::make(),
            'text' => self::randomString('text'),
            'photo' => self::randoBinary(),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Story(
            $data['user'],
            $data['text'],
            $data['photo'],
            $data['status']
        );
    }
}
