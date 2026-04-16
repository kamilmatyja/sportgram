<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{PushSubscription, User};
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
        $this->assertSame($user, $entity->user);
        $this->assertSame($endpoint, $entity->endpoint);
        $this->assertSame($p256dh, $entity->p256dh);
        $this->assertSame($auth, $entity->auth);
        $this->assertSame($userAgent, $entity->userAgent);
        $this->assertSame($status, $entity->status);
    }
}
