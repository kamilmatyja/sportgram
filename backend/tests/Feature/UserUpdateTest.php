<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\UserFactory;

class UserUpdateTest extends ApiTestCase
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
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->put("/api/users/{$user->id->toString()}", [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
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
            'roles',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should not be blank.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testNullRequiredFields(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => null,
            'firstName' => null,
            'lastName' => null,
            'gender' => null,
            'phone' => null,
            'email' => null,
            'link' => null,
            'language' => null,
            'country' => null,
            'theme' => null,
            'color' => null,
            'profilePhoto' => null,
            'backgroundPhoto' => null,
            'bio' => null,
            'roles' => null,
            'disciplines' => null,
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
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
            'roles',
        ];
        $typeErrors = [
            'birthAt' => 'This value should be of type string.',
            'firstName' => 'This value should be of type string.',
            'lastName' => 'This value should be of type string.',
            'gender' => 'This value should be of type int.',
            'phone' => 'This value should be of type int.',
            'email' => 'This value should be of type string.',
            'link' => 'This value should be of type string.',
            'language' => 'This value should be of type int.',
            'country' => 'This value should be of type int.',
            'theme' => 'This value should be of type int.',
            'color' => 'This value should be of type int.',
            'profilePhoto' => 'This value should be of type string.',
            'backgroundPhoto' => 'This value should be of type string.',
            'bio' => 'This value should be of type string.',
            'roles' => 'This value should be of type array.',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                $typeErrors[$field],
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testDuplicate(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $duplicate = UserFactory::make([
            'email' => 'duplicate@example.com',
            'phone' => 111222333,
            'link' => 'duplicate-link',
        ]);
        $this->save($duplicate);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 111222333,
            'email' => 'duplicate@example.com',
            'password' => 'tajnehaslo',
            'link' => 'duplicate-link',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['phone', 'email', 'link'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value is already used.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testInvalidBase64(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'unique@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek2',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => 'not_base64',
            'backgroundPhoto' => 'not_base64',
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['profilePhoto', 'backgroundPhoto'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be a valid base64 string.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testInvalidTypes(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 'ala ma kota',
            'email' => 'unique@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek2',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['phone'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be of type int.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testEmptyElements(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [],
            'disciplines' => [],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['roles'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should not be blank.',
                'This collection should contain 1 element or more.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testDuplicatesInElements(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1, 1],
            'disciplines' => [1, 1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['roles', 'disciplines'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This collection should contain only unique elements.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testNotExistElements(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [4],
            'disciplines' => [20],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['roles[0]', 'disciplines[0]'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'The value you selected is not a valid choice.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $userId = Uuid::v4()->toString();

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$userId}", $data, $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/2137", $data, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testAdminUser(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $user2 = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user2->id->toString()}", $data, $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testAnotherUser(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $user2 = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user2->id->toString()}", $data, $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testWithoutToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [1],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithoutPermission(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [3],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Role not allowed for this user.', $result['json']['error']);
    }

    final public function testWithExcludedRole(): void
    {
        $user = self::createUser(RoleEnum::Administrator);

        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'roles' => [3],
            'disciplines' => [1],
        ];
        $result = $this->put("/api/users/{$user->id->toString()}", $data, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
