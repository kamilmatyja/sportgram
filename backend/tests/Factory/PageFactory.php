<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Page;
use App\Enum\{ColorEnum, ElementStatusEnum};

final class PageFactory extends BaseFactory
{
    public static function make(array $overrides = []): Page
    {
        $defaults = [
            'user' => UserFactory::make(),
            'title' => self::randomString('title'),
            'description' => self::randomString('description'),
            'link' => self::randomString('link'),
            'profilePhoto' => self::randoBinary(),
            'backgroundPhoto' => self::randoBinary(),
            'color' => self::randomEnum(ColorEnum::class),
            'status' => self::randomEnum(ElementStatusEnum::class),
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
            $data['status'],
        );
    }
}
