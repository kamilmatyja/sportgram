<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserRegisterCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testEmptyPayload(): void
    {
        $result = $this->post('/api/registers', []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'email',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should not be blank.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testInvalidEmail(): void
    {
        $result = $this->post('/api/registers', ['email' => 'not-an-email']);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('email', $result['json']['errors']);
        $this->assertEquals([
            'This value is not a valid email address.',
        ], $result['json']['errors']['email']);
    }

    final public function testUserNotFound(): void
    {
        $result = $this->post('/api/registers', ['email' => 'notfound@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User not found.', $result['json']['error']);
    }

    final public function testUserBanned(): void
    {
        UserFactory::make([
            'email' => 'banned@example.com',
            'status' => UserStatusEnum::Banned,
        ], $this->em);

        $result = $this->post('/api/registers', ['email' => 'banned@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User is banned.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make([
            'email' => 'attempts@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        UserRegisterFactory::make([
            'user' => $user,
            'attempt' => 3,
            'status' => UnauthorizedStatusEnum::Incorrect,
        ], $this->em);

        $result = $this->post('/api/registers', ['email' => 'attempts@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make([
            'email' => 'success@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        UserRegisterFactory::make([
            'user' => $user,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::Sent,
        ], $this->em);

        $result = $this->post('/api/registers', ['email' => 'success@example.com']);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
