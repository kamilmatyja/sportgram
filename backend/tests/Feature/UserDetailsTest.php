<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;

class UserDetailsTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testWithoutToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users/' . $user->id->toString());
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users/' . $user1->id->toString(), $user2);
        $this->assertEquals(200, $result['status']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $result = $this->get('/api/users/' . $userId, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users/2137', $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users/' . $user->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $expectedKeys = [
            'id',
            'createdAt',
            'updatedAt',
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'link',
            'language',
            'country',
            'theme',
            'color',
            'profilePhoto',
            'backgroundPhoto',
            'bio',
            'status',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $json);
        }
    }

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get(
            '/api/users/' . $user->id->toString() . '?include[]=userDisciplines&include[]=userRoles',
            $user,
        );
        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $expectedKeys = [
            'id',
            'createdAt',
            'updatedAt',
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'link',
            'language',
            'country',
            'theme',
            'color',
            'profilePhoto',
            'backgroundPhoto',
            'bio',
            'status',
            'disciplines',
            'roles',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $json);
        }
    }

    final public function testInvalidIncludeParam(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users/' . $user->id->toString() . '?include[]=notarealfield', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('include', $result['json']['errors']);
    }
}
