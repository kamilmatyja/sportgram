<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;

class UserUpdateStatusTest extends ApiTestCase
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
        $user = self::createUser(RoleEnum::Administrator);

        $result = $this->patch("/api/users/{$user->id->toString()}/status", [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals([
            'This value should not be blank.',
        ], $result['json']['errors']['status']);
    }

    final public function testNullRequiredFields(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => null];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals([
            'This value should be of type int.',
        ], $result['json']['errors']['status']);
    }

    final public function testInvalidType(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => 'not-an-int'];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals([
            'This value should be of type int.',
        ], $result['json']['errors']['status']);
    }

    final public function testNotExistElements(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => 999];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
        $this->assertEquals([
            'The value you selected is not a valid choice.',
        ], $result['json']['errors']['status']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $userId = Uuid::v4()->toString();

        $data = ['status' => 1];
        $result = $this->patch("/api/users/{$userId}/status", $data, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => 1];
        $result = $this->patch("/api/users/2137/status", $data, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => 1];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testWithoutToken(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = ['status' => 1];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithoutPermission(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = ['status' => 1];
        $result = $this->patch("/api/users/{$user->id->toString()}/status", $data, $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }
}
