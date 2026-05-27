<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $friendId = Uuid::v4()->toString();
        $result = $this->patch("/api/friends/{$friendId}/status", ['status' => FriendStatusEnum::Accepted->value]);
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $receiver = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make(
            ['senderUser' => $sender, 'receiverUser' => $receiver, 'status' => FriendStatusEnum::Pending],
            $this->em,
        );

        $result = $this->patch(
            "/api/friends/{$friend->id->toString()}/status",
            ['status' => FriendStatusEnum::Accepted->value],
            $otherUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testValidationFailedForPendingStatus(): void
    {
        $receiver = self::createUser(RoleEnum::Participant);
        $friend = FriendFactory::make(['receiverUser' => $receiver, 'status' => FriendStatusEnum::Pending], $this->em);

        $result = $this->patch(
            "/api/friends/{$friend->id->toString()}/status",
            ['status' => FriendStatusEnum::Pending->value],
            $receiver,
        );
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testSuccessAsReceiver(): void
    {
        $receiver = self::createUser(RoleEnum::Participant);
        $friend = FriendFactory::make(['receiverUser' => $receiver, 'status' => FriendStatusEnum::Pending], $this->em);

        $result = $this->patch(
            "/api/friends/{$friend->id->toString()}/status",
            ['status' => FriendStatusEnum::Accepted->value],
            $receiver,
        );
        $this->assertEquals(200, $result['status']);
    }
}
