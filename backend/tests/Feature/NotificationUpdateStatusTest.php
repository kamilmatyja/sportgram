<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{NotificationStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\NotificationFactory;

class NotificationUpdateStatusTest extends ApiTestCase
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

        $result = $this->patch(
            "/api/notifications/{$notificationId}/status",
            ['status' => NotificationStatusEnum::Read->value],
        );
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $notification = NotificationFactory::make(
            ['user' => $owner, 'status' => NotificationStatusEnum::Sent],
            $this->em,
        );

        $result = $this->patch(
            "/api/notifications/{$notification->id->toString()}/status",
            ['status' => NotificationStatusEnum::Read->value],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testEmptyPayload(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->patch("/api/notifications/{$notification->id->toString()}/status", [], $owner);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testInvalidStatusType(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $notification = NotificationFactory::make(['user' => $owner], $this->em);

        $result = $this->patch("/api/notifications/{$notification->id->toString()}/status", ['status' => 999], $owner);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals(['The value you selected is not a valid choice.'], $result['json']['errors']['status']);
    }

    final public function testSuccess(): void
    {
        $owner = self::createUser(RoleEnum::Participant);
        $notification = NotificationFactory::make(
            ['user' => $owner, 'status' => NotificationStatusEnum::Sent],
            $this->em,
        );

        $result = $this->patch(
            "/api/notifications/{$notification->id->toString()}/status",
            ['status' => NotificationStatusEnum::Read->value],
            $owner,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
