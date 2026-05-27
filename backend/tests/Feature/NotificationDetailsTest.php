<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

class NotificationDetailsTest extends ApiTestCase
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
        $notificationId = Uuid::v4()->toString();
        $result = $this->get("/api/notifications/{$notificationId}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->get("/api/notifications/{$notification->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $notificationId = Uuid::v4()->toString();

        $result = $this->get("/api/notifications/{$notificationId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccess(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->get("/api/notifications/{$notification->id->toString()}", $owner);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertArrayHasKey('text', $result['json']);
        $this->assertEquals($owner->id->toString(), $result['json']['userId']);
    }
}
