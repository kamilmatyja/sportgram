<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PushSubscription;
use App\Enum\PushSubscriptionStatusEnum;

final class PushSubscriptionFactory extends BaseFactory
{
    public static function make(array $overrides = []): PushSubscription
    {
        $defaults = [
            'user' => UserFactory::make(),
            'endpoint' => self::uniqueString('endpoint'),
            'p256dh' => self::uniqueString('p256dh'),
            'auth' => self::uniqueString('auth'),
            'userAgent' => self::uniqueString('userAgent'),
            'status' => self::uniqueEnum(PushSubscriptionStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new PushSubscription(
            $data['user'],
            $data['endpoint'],
            $data['p256dh'],
            $data['auth'],
            $data['userAgent'],
            $data['status']
        );
    }
}
