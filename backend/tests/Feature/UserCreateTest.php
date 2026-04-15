<?php

declare(strict_types=1);

namespace Tests\Feature;

class UserCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();

        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testEmptyPayload(): void
    {
        $result = $this->post('/api/users', []);
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
            'link',
            'language',
            'country',
            'theme',
            'color',
            'profilePhoto',
            'backgroundPhoto',
            'bio',
            'roles'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should not be blank.'
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
            'link' => null,
            'language' => null,
            'country' => null,
            'theme' => null,
            'color' => null,
            'profilePhoto' => null,
            'backgroundPhoto' => null,
            'bio' => null,
            'status' => null,
            'roles' => null,
        ];
        $result = $this->post('/api/users', $data);
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
            'link',
            'language',
            'country',
            'theme',
            'color',
            'profilePhoto',
            'backgroundPhoto',
            'bio',
            'roles'
        ];
        $typeErrors = [
            'birthAt' => 'This value should be of type string.',
            'firstName' => 'This value should be of type string.',
            'lastName' => 'This value should be of type string.',
            'gender' => 'This value should be of type int.',
            'phone' => 'This value should be of type int.',
            'email' => 'This value should be of type string.',
            'password' => 'This value should be of type string.',
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
                $typeErrors[$field]
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
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'status' => 1,
            'roles' => [1, 2],
        ];

        $result1 = $this->post('/api/users', $data);
        $this->assertEquals(201, $result1['status']);
        $this->assertArrayHasKey('id', $result1['json']);

        $result2 = $this->post('/api/users', $data);
        $this->assertEquals(400, $result2['status']);
        $this->assertArrayHasKey('errors', $result2['json']);
        $expected = [
            'phone',
            'email',
            'link',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result2['json']['errors']);
            $this->assertEquals([
                'This value is already used.'
            ], $result2['json']['errors'][$field]);
        }
    }

    final public function testInvalidBase64(): void
    {
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
            'status' => 1,
            'roles' => [1, 2],
        ];
        $result = $this->post('/api/users', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'profilePhoto',
            'backgroundPhoto'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be a valid base64 string.'
            ], $result['json']['errors'][$field]);
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
            'link' => 'janek2',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'status' => 1,
            'roles' => [1, 2],
        ];
        $result = $this->post('/api/users', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'phone'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be of type int.'
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testEmptyRoles(): void
    {
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
            'status' => 1,
            'roles' => [],
        ];

        $result = $this->post('/api/users', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should not be blank.',
                'This collection should contain 1 element or more.'
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testDuplicateRoles(): void
    {
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
            'status' => 1,
            'roles' => [1, 2, 1],
        ];

        $result = $this->post('/api/users', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This collection should contain only unique elements.'
            ], $result['json']['errors'][$field]);
        }
    }

    final public function testNotExistRole(): void
    {
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
            'status' => 1,
            'roles' => [4],
        ];

        $result = $this->post('/api/users', $data);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'roles[0]'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'The value you selected is not a valid choice.'
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
            'link' => 'janek',
            'language' => 2,
            'country' => 35,
            'theme' => 1,
            'color' => 3,
            'profilePhoto' => base64_encode('hello'),
            'backgroundPhoto' => base64_encode('hello'),
            'bio' => 'Testowy użytkownik',
            'status' => 1,
            'roles' => [1, 2],
        ];

        $result = $this->post('/api/users', $data);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
