<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{EntryTypeEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\EntryFactory;

class EntryDetailsTest extends ApiTestCase
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

    final public function testWithoutToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $entry = EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ]);
        $this->save($entry);

        $result = $this->get('/api/entries/' . $entry->id->toString());
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testNotExistElement(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $entryId = Uuid::v4()->toString();

        $result = $this->get('/api/entries/' . $entryId, $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Element not found.', $result['json']['error']);
    }

    final public function testInvalidIdType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/entries/2137', $user);
        $this->assertEquals(404, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('The uid for the "id" parameter is invalid.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $entry = EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ]);
        $this->save($entry);

        $result = $this->get('/api/entries/' . $entry->id->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $expectedKeys = [
            'id',
            'userId',
            'entityId',
            'createdAt',
            'updatedAt',
            'type',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $json);
        }
    }
}
