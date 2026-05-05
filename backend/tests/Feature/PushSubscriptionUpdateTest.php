<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{PushSubscriptionStatusEnum, RoleEnum};
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionUpdateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('push_subscriptions');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $subscription = PushSubscriptionFactory::make(['user' => $owner], $this->em);

        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/UPDATED',
            'p256dh' => 'UPDATED_KEY...',
            'auth' => 'UPDATED_AUTH',
            'status' => PushSubscriptionStatusEnum::Active->value,
        ];

        $result = $this->put("/api/push-subscriptions/{$subscription->id->toString()}", $payload, $otherUser);
        $this->assertEquals(403, $result['status']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testValidationFailed(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $user], $this->em);

        $payload = [
            'endpoint' => '',
            'p256dh' => 'UPDATED_KEY...',
            'auth' => 'UPDATED_AUTH',
            'status' => 999,
        ];

        $result = $this->put("/api/push-subscriptions/{$subscription->id->toString()}", $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('endpoint', $result['json']['errors']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $user], $this->em);

        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/UPDATED',
            'p256dh' => 'UPDATED_KEY...',
            'auth' => 'UPDATED_AUTH',
            'status' => PushSubscriptionStatusEnum::Inactive->value,
        ];

        $result = $this->put("/api/push-subscriptions/{$subscription->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
    }
}
