<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

class NotificationDeleteTest extends ApiTestCase
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
        $result = $this->delete("/api/notifications/{$notificationId}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/notifications/{$notification->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/notifications/{$notification->id->toString()}", $owner);
        $this->assertEquals(200, $result['status']);
    }
}
