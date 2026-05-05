<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserPasswordResetFactory};

class UserPasswordResetConfirmTest extends ApiTestCase
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
        $user = UserFactory::make(['email' => 'resetc1@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 0,
                'status' => UnauthorizedStatusEnum::Sent,
            ],
            $this->em,
        );

        $result = $this->patch("/api/password-resets/{$reset->id}/confirm", []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('code', $result['json']['errors']);
        $this->assertEquals(['This value should not be blank.'], $result['json']['errors']['code']);
        $this->assertArrayHasKey('password', $result['json']['errors']);
        $this->assertEquals(['This value should not be blank.'], $result['json']['errors']['password']);
    }

    final public function testInvalidCodeType(): void
    {
        $user = UserFactory::make(['email' => 'resetc2@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 0,
                'status' => UnauthorizedStatusEnum::Sent,
            ],
            $this->em,
        );

        $result = $this->patch(
            "/api/password-resets/{$reset->id}/confirm",
            ['code' => 'notanumber', 'password' => 'pass'],
        );
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('code', $result['json']['errors']);
        $this->assertEquals(['This value should be of type int.'], $result['json']['errors']['code']);
    }

    final public function testNotExistElement(): void
    {
        $userPasswordResetId = Uuid::v4()->toString();

        $result = $this->patch(
            "/api/password-resets/{$userPasswordResetId}/confirm",
            ['code' => 123456, 'password' => 'zaq1@WSX'],
        );
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testCodeAlreadyUsed(): void
    {
        $user = UserFactory::make(['email' => 'resetc3@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 1,
                'status' => UnauthorizedStatusEnum::Correct,
            ],
            $this->em,
        );

        $result = $this->patch(
            "/api/password-resets/{$reset->id}/confirm",
            ['code' => 123456, 'password' => 'zaq1@WSX'],
        );
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Code already used.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make(['email' => 'resetc4@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 3,
                'status' => UnauthorizedStatusEnum::Incorrect,
            ],
            $this->em,
        );

        $result = $this->patch(
            "/api/password-resets/{$reset->id}/confirm",
            ['code' => 123456, 'password' => 'zaq1@WSX'],
        );
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testInvalidCode(): void
    {
        $user = UserFactory::make(['email' => 'resetc5@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 0,
                'status' => UnauthorizedStatusEnum::Sent,
            ],
            $this->em,
        );

        $result = $this->patch(
            "/api/password-resets/{$reset->id}/confirm",
            ['code' => 654321, 'password' => 'zaq1@WSX'],
        );
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Invalid code.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make(['email' => 'resetc6@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            [
                'user' => $user,
                'code' => 123456,
                'attempt' => 0,
                'status' => UnauthorizedStatusEnum::Sent,
            ],
            $this->em,
        );

        $result = $this->patch(
            "/api/password-resets/{$reset->id}/confirm",
            ['code' => 123456, 'password' => 'newpassword'],
        );
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
