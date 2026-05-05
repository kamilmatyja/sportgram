<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{NotificationStatusEnum, RoleEnum};
use Tests\Factory\NotificationFactory;

class NotificationIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('notifications');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/notifications');
        $this->assertEquals(401, $result['status']);
    }

    final public function testShowsOwnNotificationsOnly(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        NotificationFactory::make(['user' => $user], $this->em);
        NotificationFactory::make(['user' => $user], $this->em);
        NotificationFactory::make(['user' => $otherUser], $this->em);

        $result = $this->get('/api/notifications', $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);
    }

    final public function testFiltersAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        NotificationFactory::make(
            ['user' => $user, 'text' => 'Message about event', 'status' => NotificationStatusEnum::Sent],
            $this->em,
        );
        NotificationFactory::make(
            ['user' => $user, 'text' => 'New message', 'status' => NotificationStatusEnum::Sent],
            $this->em,
        );
        NotificationFactory::make(
            ['user' => $user, 'text' => 'Old message', 'status' => NotificationStatusEnum::Read],
            $this->em,
        );

        // Filter text & status
        $result = $this->get('/api/notifications?filter[text]=essa&filter[status]=2', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);

        // Sort by text desc
        $resultSort = $this->get('/api/notifications?filter[status]=2&sort=text:desc', $user);
        $this->assertEquals(200, $resultSort['status']);
        $this->assertEquals('New message', $resultSort['json'][0]['text']);
        $this->assertEquals('Message about event', $resultSort['json'][1]['text']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            NotificationFactory::make(['user' => $user], $this->em);
        }

        $result = $this->get('/api/notifications?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
