<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationActivityFactory;

class ConversationActivityDetailsTest extends ApiTestCase
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

        $conversationActivity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->get('/api/conversation-activity-users/' . $user1->id->toString());
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbidden(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);
        $user3 = self::createUser(RoleEnum::Participant);

        $conversationActivity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->get('/api/conversation-activity-users/' . $user1->id->toString(), $user3);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->get('/api/conversation-activity-users/' . $userId, $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/conversation-activity-users/2137', $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $conversationActivity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->get('/api/conversation-activity-users/' . $user1->id->toString(), $user2);
        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $expectedKeys = [
            'id',
            'createdAt',
            'updatedAt',
            'senderUserId',
            'receiverUserId',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $json);
        }
    }
}
