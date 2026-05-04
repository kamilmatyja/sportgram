<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ConversationStatusEnum, RoleEnum};
use Tests\Factory\{ConversationFactory, UserFactory};

class ConversationIndexTest extends ApiTestCase
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
        $result = $this->get('/api/conversations');
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver = UserFactory::make(em: $this->em);

        for ($i = 0; $i < 3; ++$i) {
            $conversation = ConversationFactory::make([
                'senderUser' => $user,
                'receiverUser' => $receiver,
                'status' => ConversationStatusEnum::Sent,
            ], $this->em);
        }

        $result = $this->get('/api/conversations?filter[userId]=' . $receiver->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(3, $result['json']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver = UserFactory::make(em: $this->em);

        for ($i = 0; $i < 15; ++$i) {
            $conversation = ConversationFactory::make([
                'senderUser' => $user,
                'receiverUser' => $receiver,
                'status' => ConversationStatusEnum::Sent,
            ], $this->em);
        }

        $result = $this->get('/api/conversations?page=2&limit=5&filter[userId]=' . $receiver->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }

    final public function testSortByStatus(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver1 = UserFactory::make(em: $this->em);
        $receiver2 = UserFactory::make(em: $this->em);

        $conv1 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver1,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);
        $conv2 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver2,
            'status' => ConversationStatusEnum::Read,
        ], $this->em);

        $result = $this->get('/api/conversations?sort=status:desc&filter[userId]=' . $user->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $statuses = array_column($result['json'], 'status');
        $this->assertTrue($statuses[0] >= $statuses[1]);
    }

    final public function testFilterStatus(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver = UserFactory::make(em: $this->em);

        $conv1 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver,
            'status' => ConversationStatusEnum::Sent,
        ], $this->em);
        $conv2 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver,
            'status' => ConversationStatusEnum::Read,
        ], $this->em);

        $result = $this->get(
            '/api/conversations?filter[status]=' . ConversationStatusEnum::Read->value . '&filter[userId]=' . $receiver->id->toString(
            ),
            $user,
        );
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
    }

    final public function testFilterUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $receiver1 = UserFactory::make(em: $this->em);
        $receiver2 = UserFactory::make(em: $this->em);

        $conversation1 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver1,
        ], $this->em);
        $conversation2 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver2,
        ], $this->em);
        $conversation3 = ConversationFactory::make([
            'senderUser' => $user,
            'receiverUser' => $receiver2,
        ], $this->em);

        $result = $this->get('/api/conversations?filter[userId]=' . $receiver2->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);
    }

    final public function testInvalidParams(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/conversations?page=abc', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('page', $result['json']['errors']);
    }
}
