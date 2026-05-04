<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{UserFactory, UserSignFactory};

class UserSignConfirmTest extends ApiTestCase
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
        $user = UserFactory::make(['email' => 'signc1@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 0, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('code', $result['json']['errors']);
        $this->assertEquals(['This value should not be blank.'], $result['json']['errors']['code']);
    }

    final public function testInvalidCodeType(): void
    {
        $user = UserFactory::make(['email' => 'signc2@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 0, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", ['code' => 'notanumber']);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('code', $result['json']['errors']);
        $this->assertEquals(['This value should be of type int.'], $result['json']['errors']['code']);
    }

    final public function testNotExistElement(): void
    {
        $userSignId = Uuid::v4()->toString();

        $result = $this->patch("/api/signs/{$userSignId}/confirm", ['code' => 123456]);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testCodeAlreadyUsed(): void
    {
        $user = UserFactory::make(['email' => 'signc3@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 1, 'status' => UnauthorizedStatusEnum::Correct],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", ['code' => 123456]);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Code already used.', $result['json']['error']);
    }

    final public function testTooManyAttempts(): void
    {
        $user = UserFactory::make(['email' => 'signc4@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 3, 'status' => UnauthorizedStatusEnum::Incorrect],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", ['code' => 123456]);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Too many attempts.', $result['json']['error']);
    }

    final public function testInvalidCode(): void
    {
        $user = UserFactory::make(['email' => 'signc5@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 0, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", ['code' => 654321]);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Invalid code.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = UserFactory::make(['email' => 'signc6@example.com', 'status' => UserStatusEnum::Accepted], $this->em);

        $sign = UserSignFactory::make(
            ['user' => $user, 'code' => 123456, 'attempt' => 0, 'status' => UnauthorizedStatusEnum::Sent],
        );

        $result = $this->patch("/api/signs/{$sign->id}/confirm", ['code' => 123456]);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('token', $result['json']);
    }
}
