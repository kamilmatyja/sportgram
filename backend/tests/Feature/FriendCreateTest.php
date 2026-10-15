<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{FriendFactory, UserFactory};

class FriendCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $payload = [
            'userId' => Uuid::v4()->toString(),
        ];

        $result = $this->post('/api/friends', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/friends', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('userId', $result['json']['errors']);
    }

    final public function testInvalidUserId(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'userId' => 'not-a-uuid',
        ];

        $result = $this->post('/api/friends', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('userId', $result['json']['errors']);
    }

    final public function testUserNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'userId' => Uuid::v4()->toString(),
        ];

        $result = $this->post('/api/friends', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('userId', $result['json']['errors']);
        $this->assertCount(1, $result['json']['errors']['userId']);
        $this->assertStringEndsWith('not found.', $result['json']['errors']['userId'][0]);
        $this->assertStringNotContainsString('{{ entity }}', $result['json']['errors']['userId'][0]);
    }

    final public function testAlreadyFriends(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $receiver = UserFactory::make(em: $this->em);

        FriendFactory::make([
            'senderUser' => $sender,
            'receiverUser' => $receiver,
            'status' => FriendStatusEnum::Accepted,
        ], $this->em);

        $payload = [
            'userId' => $receiver->id->toString(),
        ];

        $result = $this->post('/api/friends', $payload, $sender);
        $this->assertEquals(409, $result['status']);
        $this->assertEquals('User already has friend relationship with this user.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $sender = self::createUser(RoleEnum::Participant);
        $receiver = UserFactory::make(em: $this->em);

        $payload = [
            'userId' => $receiver->id->toString(),
        ];

        $result = $this->post('/api/friends', $payload, $sender);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
