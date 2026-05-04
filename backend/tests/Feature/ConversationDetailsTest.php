<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ConversationStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationFactory;

class ConversationDetailsTest extends ApiTestCase
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

    final public function testWithoutToken(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->get('/api/conversations/' . $conversation->id->toString());
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);
        $user3 = self::createUser(RoleEnum::Participant);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->get('/api/conversations/' . $conversation->id->toString(), $user3);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $conversationId = Uuid::v4()->toString();

        $result = $this->get('/api/conversations/' . $conversationId, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/conversations/2137', $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $conversation = ConversationFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);

        $result = $this->get('/api/conversations/' . $conversation->id->toString(), $user1);
        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $expectedKeys = [
            'id',
            'senderUserId',
            'receiverUserId',
            'createdAt',
            'updatedAt',
            'text',
            'status',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $json);
        }
    }
}
