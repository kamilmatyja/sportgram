<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendDeleteTest extends ApiTestCase
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
        $result = $this->delete("/api/friends/{$friendId}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForReceiver(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $receiver = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make(
            ['senderUser' => $sender, 'receiverUser' => $receiver, 'status' => FriendStatusEnum::Pending],
            $this->em,
        );

        $result = $this->delete("/api/friends/{$friend->id->toString()}", $receiver);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsSender(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $friend = FriendFactory::make(['senderUser' => $sender, 'status' => FriendStatusEnum::Pending], $this->em);

        $result = $this->delete("/api/friends/{$friend->id->toString()}", $sender);
        $this->assertEquals(200, $result['status']);
    }
}
