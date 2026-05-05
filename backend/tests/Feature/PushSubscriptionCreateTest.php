<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{PushSubscriptionStatusEnum, RoleEnum};

class PushSubscriptionCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('push_subscriptions');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/12345',
            'p256dh' => 'BNcRdreALRFGsyfC3...',
            'auth' => 'AUTH_KEY_STRING',
            'status' => PushSubscriptionStatusEnum::Active->value,
        ];

        $result = $this->post('/api/push-subscriptions', $payload);
        $this->assertEquals(401, $result['status']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/push-subscriptions', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);

        $expected = ['endpoint', 'p256dh', 'auth', 'status'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
        }
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/12345',
            'p256dh' => 'BNcRdreALRFGsyfC3...',
            'auth' => 'AUTH_KEY_STRING',
            'userAgent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'status' => PushSubscriptionStatusEnum::Active->value,
        ];

        $result = $this->post('/api/push-subscriptions', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
