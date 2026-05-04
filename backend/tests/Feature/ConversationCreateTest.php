<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\FriendFactory;

class ConversationCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('conversation_activity');
        $this->truncate('conversations');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);

        $payload = ['text' => 'Hello!'];

        $result = $this->post('/api/conversation-users/' . $user1->id->toString(), $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testNotFriend(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $payload = ['text' => 'Hello!'];

        $result = $this->post('/api/conversation-users/' . $user2->id->toString(), $payload, $user1);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User is not friend.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $result = $this->post('/api/conversation-users/' . $user2->id->toString(), [], $user1);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
    }

    final public function testNullRequiredFields(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $payload = ['text' => null];

        $result = $this->post('/api/conversation-users/' . $user2->id->toString(), $payload, $user1);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
    }

    final public function testNotExistElement(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $payload = ['text' => 'Hello!'];

        $result = $this->post('/api/conversation-users/' . $userId, $payload, $user1);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $payload = ['text' => 'Hello friend!'];

        $result = $this->post('/api/conversation-users/' . $user2->id->toString(), $payload, $user1);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
