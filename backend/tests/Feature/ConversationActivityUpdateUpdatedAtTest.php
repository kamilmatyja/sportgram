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

        ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->patch('/api/conversation-activity-users/' . $user1->id->toString() . '/updated-at', []);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbidden(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->patch(
            '/api/conversation-activity-users/' . $user->id->toString() . '/updated-at',
            [],
            $user,
        );
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->patch('/api/conversation-activity-users/' . $userId . '/updated-at', [], $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->patch('/api/conversation-activity-users/2137/updated-at', [], $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $activity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->patch(
            '/api/conversation-activity-users/' . $user2->id->toString() . '/updated-at',
            [],
            $user1,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertEquals($activity->id->toString(), $result['json']['id']);
    }

    final public function testSuccessReceiver(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $activity = ConversationActivityFactory::make([
            'senderUser' => $user1,
            'receiverUser' => $user2,
        ], $this->em);

        $result = $this->patch(
            '/api/conversation-activity-users/' . $user1->id->toString() . '/updated-at',
            [],
            $user2,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertNotEquals($activity->id->toString(), $result['json']['id']);
    }
}
