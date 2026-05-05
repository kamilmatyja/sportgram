<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionDeleteTest extends ApiTestCase
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

        $result = $this->delete("/api/push-subscriptions/{$subscription->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $subscription = PushSubscriptionFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/push-subscriptions/{$subscription->id->toString()}", $owner);
        $this->assertEquals(200, $result['status']);
    }
}
