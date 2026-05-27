<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionDetailsTest extends ApiTestCase
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
        $result = $this->get("/api/push-subscriptions/{$id}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $subscription = PushSubscriptionFactory::make(['user' => $owner], $this->em);

        $result = $this->get("/api/push-subscriptions/{$subscription->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $id = Uuid::v4()->toString();

        $result = $this->get("/api/push-subscriptions/{$id}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $user], $this->em);

        $result = $this->get("/api/push-subscriptions/{$subscription->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertEquals($user->id->toString(), $result['json']['userId']);
    }
}
