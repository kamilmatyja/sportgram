<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\PushSubscriptionFactory;

class PushSubscriptionIndexTest extends ApiTestCase
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
        $result = $this->get('/api/push-subscriptions');
        $this->assertEquals(401, $result['status']);
    }

    final public function testShowsOwnSubscriptionsOnly(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        PushSubscriptionFactory::make(['user' => $user], $this->em);
        PushSubscriptionFactory::make(['user' => $user], $this->em);
        PushSubscriptionFactory::make(['user' => $otherUser], $this->em);

        $result = $this->get('/api/push-subscriptions', $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);
    }

    final public function testFiltersAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        PushSubscriptionFactory::make(['user' => $user, 'endpoint' => 'endpoint-a'], $this->em);
        PushSubscriptionFactory::make(['user' => $user, 'endpoint' => 'endpoint-b'], $this->em);
        PushSubscriptionFactory::make(['user' => $user, 'endpoint' => 'different'], $this->em);

        $result = $this->get('/api/push-subscriptions?filter[endpoint]=endpoint-b', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals('endpoint-b', $result['json'][0]['endpoint']);

        $resultSort = $this->get('/api/push-subscriptions?sort=endpoint:desc', $user);
        $this->assertEquals(200, $resultSort['status']);
        $this->assertEquals('endpoint-b', $resultSort['json'][0]['endpoint']);
        $this->assertEquals('endpoint-a', $resultSort['json'][1]['endpoint']);
        $this->assertEquals('different', $resultSort['json'][2]['endpoint']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            PushSubscriptionFactory::make(['user' => $user], $this->em);
        }

        $result = $this->get('/api/push-subscriptions?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
