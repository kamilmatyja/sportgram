<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\PageFactory;

class UserDeleteTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $user]);
        $this->save($page);

        $result = $this->delete("/api/users/{$user->id->toString()}", $user);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Cannot delete user with pages.', $result['json']['error']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->delete("/api/users/{$userId}", $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->delete("/api/users/2137", $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testAdminUser(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $user2 = self::createUser(RoleEnum::Participant);

        $result = $this->delete("/api/users/{$user2->id->toString()}", $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testAnotherUser(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $user2 = self::createUser(RoleEnum::Participant);

        $result = $this->delete("/api/users/{$user2->id->toString()}", $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->delete("/api/users/{$user->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testWithoutToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->delete("/api/users/{$user->id->toString()}");
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }
}
