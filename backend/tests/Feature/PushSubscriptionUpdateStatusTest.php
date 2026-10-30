<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{PushSubscriptionStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionUpdateStatusTest extends ApiTestCase
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
        $id = Uuid::v4()->toString();

        $result = $this->patch(
            "/api/push-subscriptions/{$id}/status",
            ['status' => PushSubscriptionStatusEnum::Active->value],
        );
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $subscription = PushSubscriptionFactory::make(
            ['user' => $owner, 'status' => PushSubscriptionStatusEnum::Active],
            $this->em,
        );

        $result = $this->patch(
            "/api/push-subscriptions/{$subscription->id->toString()}/status",
            ['status' => PushSubscriptionStatusEnum::Rejected->value],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testEmptyPayload(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $owner], $this->em);

        $result = $this->patch("/api/push-subscriptions/{$subscription->id->toString()}/status", [], $owner);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testInvalidStatusType(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $owner], $this->em);

        $result = $this->patch("/api/push-subscriptions/{$subscription->id->toString()}/status", ['status' => 999], $owner);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals(['This value was of an unexpected type.'], $result['json']['errors']['status']);
    }

    final public function testSuccess(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(
            ['user' => $owner, 'status' => PushSubscriptionStatusEnum::Active],
            $this->em,
        );

        $result = $this->patch(
            "/api/push-subscriptions/{$subscription->id->toString()}/status",
            ['status' => PushSubscriptionStatusEnum::Rejected->value],
            $owner,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
