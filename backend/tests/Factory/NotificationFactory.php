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
            'text' => self::uniqueString('text'),
            'status' => self::uniqueEnum(NotificationStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Notification(
            $data['user'],
            $data['text'],
            $data['status']
        );
    }
}
