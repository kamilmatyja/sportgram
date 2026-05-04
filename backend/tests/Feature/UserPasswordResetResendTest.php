<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserPasswordResetFactory};

class UserPasswordResetResendTest extends ApiTestCase
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

    final public function testNotExistElement(): void
    {
        $userPasswordResetId = Uuid::v4()->toString();

        $result = $this->post("/api/password-resets/{$userPasswordResetId}/resend", []);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testCodeAlreadyUsed(): void
    {
        $user = UserFactory::make(['email' => 'resendpr1@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 1, 'status' => UnauthorizedStatusEnum::Correct],
        );

        $result = $this->post("/api/password-resets/{$reset->id}/resend", []);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Code already used.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make(['email' => 'resendpr2@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 3, 'status' => UnauthorizedStatusEnum::Incorrect],
        );

        $result = $this->post("/api/password-resets/{$reset->id}/resend", []);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make(['email' => 'resendpr3@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $reset = UserPasswordResetFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 1, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->post("/api/password-resets/{$reset->id}/resend", []);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
