<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class FriendDetailsTest extends ApiTestCase
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
        $result = $this->get("/api/friends/{$friendId}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForOtherUser(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $receiver = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make(['senderUser' => $sender, 'receiverUser' => $receiver], $this->em);

        $result = $this->get("/api/friends/{$friend->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $friendId = Uuid::v4()->toString();

        $result = $this->get("/api/friends/{$friendId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccessForSender(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $friend = FriendFactory::make(['senderUser' => $user], $this->em);

        $result = $this->get("/api/friends/{$friend->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertEquals($user->id->toString(), $result['json']['senderUserId']);
    }

    final public function testSuccessForReceiver(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $friend = FriendFactory::make(['receiverUser' => $user], $this->em);

        $result = $this->get("/api/friends/{$friend->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertEquals($user->id->toString(), $result['json']['receiverUserId']);
    }
}
