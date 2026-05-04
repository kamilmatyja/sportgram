<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ConversationStatusEnum, FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationFactory, FriendFactory};

class ConversationUpdateTest extends ApiTestCase
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
        ], $this->em);

        $payload = ['text' => 'update!'];

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testOtherParticipantForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $payload = ['text' => 'update!'];

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), $payload, $user2);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testAdminForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Administrator);

        $friend = FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $payload = ['text' => 'update!'];

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), $payload, $user2);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
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

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), [], $user1);
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

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $payload = ['text' => null];

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), $payload, $user1);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
    }

    final public function testNotExistElement(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $payload = ['text' => 'update!'];

        $result = $this->put('/api/conversations/' . $userId, $payload, $user1);
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

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $payload = ['text' => 'updated text!'];

        $result = $this->put('/api/conversations/' . $conversation->id->toString(), $payload, $user1);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
