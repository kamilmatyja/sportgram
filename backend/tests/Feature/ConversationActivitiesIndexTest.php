<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\{ConversationActivityFactory, UserFactory};

class ConversationActivitiesIndexTest extends ApiTestCase
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
        $result = $this->get('/api/conversation-activities');
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver = UserFactory::make(em: $this->em);

        for ($i = 0; $i < 3; ++$i) {
            $conversationActivity = ConversationActivityFactory::make([
                'senderUser' => $user,
                'receiverUser' => $receiver,
            ], $this->em);
        }

        $result = $this->get('/api/conversation-activities', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertIsArray($result['json']);
        $this->assertCount(3, $result['json']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver = UserFactory::make(em: $this->em);

        for ($i = 0; $i < 15; ++$i) {
            $conversationActivity = ConversationActivityFactory::make([
                'senderUser' => $user,
                'receiverUser' => $receiver,
            ], $this->em);
        }

        $result = $this->get('/api/conversation-activities?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertIsArray($result['json']);
        $this->assertCount(5, $result['json']);
    }

    final public function testFilterUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver1 = UserFactory::make(em: $this->em);
        $receiver2 = UserFactory::make(em: $this->em);

        $conversationActivity1 = ConversationActivityFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver1,
        ], $this->em);
        $conversationActivity2 = ConversationActivityFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver2,
        ], $this->em);
        $conversationActivity3 = ConversationActivityFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver2,
        ], $this->em);

        $result = $this->get('/api/conversation-activities?filter[userId]=' . $receiver2->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertIsArray($result['json']);
        $this->assertCount(2, $result['json']);
    }

    final public function testInvalidParams(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/conversation-activities?page=abc', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('page', $result['json']['errors']);
    }
}
