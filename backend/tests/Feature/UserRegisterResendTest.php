<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserRegisterResendTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testNotExistElement(): void
    {
        $userRegisterId = Uuid::v4()->toString();

        $result = $this->post("/api/registers/{$userRegisterId}/resend", []);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testCodeAlreadyUsed(): void
    {
        $user = UserFactory::make(['email' => 'resend1@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $register = UserRegisterFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 1, 'status' => UnauthorizedStatusEnum::Correct],
        );

        $result = $this->post("/api/registers/{$register->id}/resend", []);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Code already used.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make(['email' => 'resend2@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $register = UserRegisterFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 4, 'status' => UnauthorizedStatusEnum::Incorrect],
        );

        $result = $this->post("/api/registers/{$register->id}/resend", []);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make(['email' => 'resend3@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $register = UserRegisterFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 1, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->post("/api/registers/{$register->id}/resend", []);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
