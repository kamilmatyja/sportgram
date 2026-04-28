<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ConversationStatusEnum, FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationFactory, FriendFactory};

class ConversationUpdateStatusTest extends ApiTestCase
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
        $user2 = self::createUser(RoleEnum::Participant);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testReceiver(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload, $user2);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testOtherParticipantForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);
        $user3 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload, $user3);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testAdmin(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Administrator);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload, $user2);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testEmptyPayload(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', [], $user1);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testNullRequiredFields(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => null];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload, $user1);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testNotExistElement(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $userId . '/status', $payload, $user1);
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
        ]);
        $this->save($friend);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ]);
        $this->save($conversation);

        $payload = ['status' => ConversationStatusEnum::Read->value];

        $result = $this->patch('/api/conversations/' . $conversation->id->toString() . '/status', $payload, $user1);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
