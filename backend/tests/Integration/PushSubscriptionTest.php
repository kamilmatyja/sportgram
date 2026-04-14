<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\PushSubscription;
use App\Entity\User;
use App\Enum\PushSubscriptionStatusEnum;
use PHPUnit\Framework\TestCase;

class PushSubscriptionTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $endpoint = 'endpoint';
        $p256dh = 'p256dh';
        $auth = 'auth';
        $userAgent = 'agent';
        $status = PushSubscriptionStatusEnum::Active;
        $entity = new PushSubscription($user, $endpoint, $p256dh, $auth, $userAgent, $status);
        $this->assertInstanceOf(PushSubscription::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($endpoint, $entity->getEndpoint());
        $this->assertSame($p256dh, $entity->getP256dh());
        $this->assertSame($auth, $entity->getAuth());
        $this->assertSame($userAgent, $entity->getUserAgent());
        $this->assertSame($status, $entity->getStatus());
    }
}

