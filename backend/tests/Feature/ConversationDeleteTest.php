<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ConversationStatusEnum, FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{ConversationFactory, FriendFactory};

class ConversationDeleteTest extends ApiTestCase
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

        $result = $this->delete('/api/conversations/' . $conversation->id->toString());
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testOtherParticipantForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->delete('/api/conversations/' . $conversation->id->toString(), $user2);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testAdminForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Administrator);

        FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->delete('/api/conversations/' . $conversation->id->toString(), $user2);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testNotExistElement(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->delete('/api/conversations/' . $userId, $user1);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        FriendFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->delete('/api/conversations/' . $conversation->id->toString(), $user1);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
