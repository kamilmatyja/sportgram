<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PageFollow;
use App\Enum\PageFollowStatusEnum;

final class PageFollowFactory extends BaseFactory
{
    public static function make(array $overrides = []): PageFollow
    {
        $defaults = [
            'page' => PageFactory::make(),
            'user' => UserFactory::make(),
            'status' => self::randomEnum(PageFollowStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new PageFollow(
            $data['page'],
            $data['user'],
            $data['status'],
        );
    }
}
