<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Tests\Factory\{UserFactory, UserPasswordResetFactory, UserRegisterFactory};

class UserPasswordResetCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_password_resets');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testEmptyPayload(): void
    {
        $result = $this->post('/api/password-resets', []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('email', $result['json']['errors']);
        $this->assertEquals([
            'This value should not be blank.',
        ], $result['json']['errors']['email']);
    }

    final public function testInvalidEmail(): void
    {
        $result = $this->post('/api/password-resets', ['email' => 'not-an-email']);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('email', $result['json']['errors']);
        $this->assertEquals([
            'This value is not a valid email address.',
        ], $result['json']['errors']['email']);
    }

    final public function testUserNotFound(): void
    {
        $result = $this->post('/api/password-resets', ['email' => 'notfound@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User not found.', $result['json']['error']);
    }

    final public function testUserBanned(): void
    {
        $user = UserFactory::make([
            'email' => 'bannedpr@example.com',
            'status' => UserStatusEnum::Banned,
        ], $this->em);

        $result = $this->post('/api/password-resets', ['email' => 'bannedpr@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User is banned.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make([
            'email' => 'attemptspr@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        $userRegister = UserRegisterFactory::make([
            'user' => $user,
            'status' => UnauthorizedStatusEnum::Correct,
        ], $this->em);

        $reset = UserPasswordResetFactory::make([
            'user' => $user,
            'attempt' => 3,
            'status' => UnauthorizedStatusEnum::Incorrect,
        ], $this->em);

        $result = $this->post('/api/password-resets', ['email' => 'attemptspr@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testUserNotConfirmed(): void
    {
        $user = UserFactory::make([
            'email' => 'notconfirmed@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        $result = $this->post('/api/password-resets', ['email' => 'notconfirmed@example.com']);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('User account is not confirmed.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make([
            'email' => 'successpr@example.com',
            'status' => UserStatusEnum::Accepted,
        ], $this->em);

        $userRegister = UserRegisterFactory::make([
            'user' => $user,
            'status' => UnauthorizedStatusEnum::Correct,
        ], $this->em);

        $result = $this->post('/api/password-resets', ['email' => 'successpr@example.com']);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
