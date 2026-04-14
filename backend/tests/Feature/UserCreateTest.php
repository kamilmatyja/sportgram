<?php

declare(strict_types=1);

namespace Tests\Feature;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class UserCreateTest extends WebTestCase
{
    private KernelBrowser $client;

    final protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $container = static::getContainer();
        $em = $container->get('doctrine')->getManager();
        $connection = $em->getConnection();
        $platform = $connection->getDatabasePlatform();
        $connection->executeStatement($platform->getTruncateTableSQL('users', true));
    }

    final public function testEmptyPayload(): void
    {
        $result = $this->post([]);
        $this->assertEquals(422, $result['status']);
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
            $this->assertArrayHasKey("[$field]", $result['json']['errors']);
            $this->assertEquals(['This field is missing.'], $result['json']['errors']["[$field]"]);
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
        $result = $this->post($data);
        $this->assertEquals(422, $result['status']);
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
            $this->assertArrayHasKey("[$field]", $result['json']['errors']);
            $this->assertEquals(['This value should not be blank.'], $result['json']['errors']["[$field]"]);
        }
    }

    final public function testDuplicatePhoneAndEmail(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => '123456789',
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

        $result1 = $this->post($data);
        $this->assertEquals(201, $result1['status']);
        $this->assertArrayHasKey('id', $result1['json']);

        $result2 = $this->post($data);
        $this->assertEquals(422, $result2['status']);
        $this->assertArrayHasKey('errors', $result2['json']);
        $expected = [
            'phone',
            'email',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey("[$field]", $result2['json']['errors']);
            $this->assertEquals(['This value is already used.'], $result2['json']['errors']["[$field]"]);
        }
    }

    final public function testInvalidBase64(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => '999999999',
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
        $result = $this->post($data);
        $this->assertEquals(422, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'profilePhoto',
            'backgroundPhoto'
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey("[$field]", $result['json']['errors']);
            $this->assertEquals(['This value should be a valid base64 string.'], $result['json']['errors']["[$field]"]);
        }
    }

    final public function testSuccess(): void
    {
        $data = [
            'birthAt' => '2000-01-01',
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'gender' => 1,
            'phone' => '123456789',
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

        $result1 = $this->post($data);
        $this->assertEquals(201, $result1['status']);
        $this->assertArrayHasKey('id', $result1['json']);
    }

    private function post(array $data): array
    {
        $this->client->request('POST', '/users', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode($data));
        return [
            'status' => $this->client->getResponse()->getStatusCode(),
            'json' => json_decode($this->client->getResponse()->getContent(), true),
        ];
    }
}
