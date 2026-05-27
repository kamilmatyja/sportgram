<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{EntryTypeEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;

class EntryCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('entries');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => $user->id->toString(),
            'type' => EntryTypeEnum::User->value,
        ];

        $result = $this->post('/api/entries', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/entries', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('entityId', $result['json']['errors']);
        $this->assertArrayHasKey('type', $result['json']['errors']);
        $this->assertArrayHasKey('entityValidationData', $result['json']['errors']);
    }

    final public function testNullRequiredFields(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => null,
            'type' => null,
        ];

        $result = $this->post('/api/entries', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('entityId', $result['json']['errors']);
        $this->assertArrayHasKey('type', $result['json']['errors']);
    }

    final public function testInvalidEntityId(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => 'invalid-uuid',
            'type' => EntryTypeEnum::User->value,
        ];

        $result = $this->post('/api/entries', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('entityId', $result['json']['errors']);
    }

    final public function testInvalidType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => $user->id->toString(),
            'type' => 999,
        ];

        $result = $this->post('/api/entries', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('type', $result['json']['errors']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => Uuid::v4()->toString(),
            'type' => EntryTypeEnum::User->value,
        ];

        $result = $this->post('/api/entries', $payload, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'entityId' => $user->id->toString(),
            'type' => EntryTypeEnum::User->value,
        ];

        $result = $this->post('/api/entries', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
