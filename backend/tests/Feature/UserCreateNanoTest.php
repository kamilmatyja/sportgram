<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;

class UserCreateNanoTest extends ApiTestCase
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
        $result = $this->post('/api/users/nano', []);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'password',
            'country',
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
        $data = [
            'birthAt' => null,
            'firstName' => null,
            'lastName' => null,
            'gender' => null,
            'phone' => null,
            'email' => null,
            'password' => null,
            'country' => null,
            'roles' => null,
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'password',
            'country',
            'roles',
        ];
        $typeErrors = [
            'birthAt' => 'This value should be of type string.',
            'firstName' => 'This value should be of type string.',
            'lastName' => 'This value should be of type string.',
            'gender' => 'This value should be of type int.',
            'phone' => 'This value should be of type int.',
            'email' => 'This value should be of type string.',
            'password' => 'This value should be of type string.',
            'country' => 'This value should be of type int.',
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
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [1],
        ];
        $result1 = $this->post('/api/users/nano', $data);
        $this->assertEquals(201, $result1['status']);
        $this->assertArrayHasKey('id', $result1['json']);

        $result2 = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result2['status']);
        $this->assertArrayHasKey('errors', $result2['json']);
        $expected = [
            'phone',
            'email',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result2['json']['errors']);
            $this->assertEquals([
                'This value is already used.',
            ], $result2['json']['errors'][$field]);
        }
    }

    final public function testInvalidTypes(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 'ala ma kota',
            'email' => 'unique@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [1],
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'phone',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be of type int.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testEmptyElements(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [],
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles',
        ];
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
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [1, 1],
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This collection should contain only unique elements.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testNotExistElements(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [4],
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles[0]',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'The value you selected is not a valid choice.',
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testSuccess(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => 123456789,
            'email' => 'jan.kowalski@example.com',
            'password' => 'tajnehaslo',
            'country' => 35,
            'roles' => [1],
        ];
        $result = $this->post('/api/users/nano', $data);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testWithToken(): void
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
            'country' => 35,
            'roles' => [1],
        ];
        $result = $this->post('/api/users/nano', $data, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }

    final public function testWithPermission(): void
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
            'country' => 35,
            'roles' => [1],
        ];
        $result = $this->post('/api/users/nano', $data, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
