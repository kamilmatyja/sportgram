<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Page;
use App\Enum\ColorEnum;
use App\Enum\ElementStatusEnum;

final class PageFactory extends BaseFactory
{
    public static function make(array $overrides = []): Page
    {
        $defaults = [
            'user' => UserFactory::make(),
            'title' => self::uniqueString('title'),
            'description' => self::uniqueString('description'),
            'link' => self::uniqueString('link'),
            'profilePhoto' => self::uniqueBinaryFileString(),
            'backgroundPhoto' => self::uniqueBinaryFileString(),
            'color' => self::uniqueEnum(ColorEnum::class),
            'status' => self::uniqueEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Page(
            $data['user'],
            $data['title'],
            $data['description'],
            $data['link'],
            $data['profilePhoto'],
            $data['backgroundPhoto'],
            $data['color'],
            $data['status']
        );
    }
}
