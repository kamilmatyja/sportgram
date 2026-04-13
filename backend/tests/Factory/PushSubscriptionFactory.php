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
            'endpoint' => self::randomString('endpoint'),
            'p256dh' => self::randomString('p256dh'),
            'auth' => self::randomString('auth'),
            'userAgent' => self::randomString('userAgent'),
            'status' => self::randomEnum(PushSubscriptionStatusEnum::class),
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
