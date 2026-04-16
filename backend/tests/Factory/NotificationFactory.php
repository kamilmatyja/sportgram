<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Notification;
use App\Enum\NotificationStatusEnum;

final class NotificationFactory extends BaseFactory
{
    public static function make(array $overrides = []): Notification
    {
        $defaults = [
            'user' => UserFactory::make(),
            'text' => self::randomString('text'),
            'link' => self::randomString('link'),
            'status' => self::randomEnum(NotificationStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Notification(
            $data['user'],
            $data['text'],
            $data['link'],
            $data['status'],
        );
    }
}
