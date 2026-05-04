<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, UnauthorizedStatusEnum, UserStatusEnum};
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserSignCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_signs');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testEmptyPayload(): void
    {
        $result = $this->post('/api/signs', []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('email', $result['json']['errors']);
        $this->assertEquals([
            'This value should not be blank.',
        ], $result['json']['errors']['email']);
        $this->assertArrayHasKey('password', $result['json']['errors']);
        $this->assertEquals([
            'This value should not be blank.',
        ], $result['json']['errors']['password']);
    }

    final public function testInvalidEmail(): void
    {
        $result = $this->post('/api/signs', ['email' => 'not-an-email', 'password' => 'zaq1@WSX']);

        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('email', $result['json']['errors']);
        $this->assertEquals([
            'This value is not a valid email address.',
        ], $result['json']['errors']['email']);
    }

    final public function testUserNotFound(): void
    {
        $result = $this->post('/api/signs', ['email' => 'notfound@example.com', 'password' => 'zaq1@WSX']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User not found.', $result['json']['error']);
    }

    final public function testUserBanned(): void
    {
        $user = $this->createUser(RoleEnum::Participant, [
            'email' => 'bannedsign@example.com',
            'status' => UserStatusEnum::Banned,
        ]);

        $result = $this->post('/api/signs', ['email' => 'bannedsign@example.com', 'password' => 'zaq1@WSX']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User is banned.', $result['json']['error']);
    }

    final public function testUserNotConfirmed(): void
    {
        $user = $this->createUser(RoleEnum::Participant, [
            'email' => 'notconfirmed-sign@example.com',
            'status' => UserStatusEnum::Accepted,
        ]);

        $result = $this->post('/api/signs', ['email' => 'notconfirmed-sign@example.com', 'password' => 'zaq1@WSX']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User account is not confirmed.', $result['json']['error']);
    }

    final public function testInvalidPassword(): void
    {
        $user = UserFactory::make([
            'email' => 'invalidpass@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        $userRegister = UserRegisterFactory::make([
            'user' => $user,
            'status' => UnauthorizedStatusEnum::Correct,
        ], $this->em);

        $result = $this->post('/api/signs', ['email' => 'invalidpass@example.com', 'password' => 'wrongpass']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Invalid password.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = $this->createUser(RoleEnum::Participant, [
            'email' => 'signsuccess@example.com',
            'status' => UserStatusEnum::Accepted,
        ]);

        $userRegister = UserRegisterFactory::make([
            'user' => $user,
            'status' => UnauthorizedStatusEnum::Correct,
        ], $this->em);

        $result = $this->post('/api/signs', ['email' => 'signsuccess@example.com', 'password' => 'zaq1@WSX']);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
