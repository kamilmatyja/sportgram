<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\ConversationActivityFactory;

class ConversationActivityUpdateUpdatedAtTest extends ApiTestCase
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

        $conversationActivity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ]);
        $this->save($conversationActivity);

        $result = $this->patch('/api/conversation-activitiy-users/' . $user1->id->toString() . '/updated-at', []);
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
        ]);
        $this->save($conversationActivity);

        $result = $this->patch(
            '/api/conversation-activitiy-users/' . $user1->id->toString() . '/updated-at',
            [],
            $user3,
        );
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->patch('/api/conversation-activitiy-users/' . $userId . '/updated-at', [], $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->patch('/api/conversation-activitiy-users/2137/updated-at', [], $user);
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
        ]);
        $this->save($conversationActivity);

        $result = $this->patch(
            '/api/conversation-activitiy-users/' . $user1->id->toString() . '/updated-at',
            [],
            $user1,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testSuccessReceiver(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $conversationActivity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ]);
        $this->save($conversationActivity);

        $result = $this->patch(
            '/api/conversation-activitiy-users/' . $user2->id->toString() . '/updated-at',
            [],
            $user2,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
