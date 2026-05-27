<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{EntryTypeEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\EntryFactory;

class EntryCountIndexTest extends ApiTestCase
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
        $result = $this->get('/api/entry-counts');
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $entityId = Uuid::v4();

        for ($i = 0; $i < 3; ++$i) {
            EntryFactory::make([
                'user' => $user,
                'entityId' => $entityId,
                'type' => EntryTypeEnum::Feed,
            ], $this->em);
        }

        $result = $this->get('/api/entry-counts', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals($entityId->toString(), $result['json'][0]['entityId']);
        $this->assertEquals(EntryTypeEnum::Feed->value, $result['json'][0]['type']);
        $this->assertEquals(3, $result['json'][0]['count']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; ++$i) {
            EntryFactory::make([
                'user' => $user,
                'entityId' => Uuid::v4(),
                'type' => EntryTypeEnum::Feed,
            ], $this->em);
        }

        $result = $this->get('/api/entry-counts?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }

    final public function testSortByType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);
        EntryFactory::make([
            'user' => $user,
            'entityId' => Uuid::v4(),
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entry-counts?sort=type:desc', $user);
        $this->assertEquals(200, $result['status']);
        $types = array_column($result['json'], 'type');
        $this->assertEquals([EntryTypeEnum::Feed->value, EntryTypeEnum::User->value], array_slice($types, 0, 2));
    }

    final public function testFilterEntityIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $entityId1 = Uuid::v4();
        $entityId2 = Uuid::v4();

        EntryFactory::make([
            'user' => $user,
            'entityId' => $entityId1,
            'type' => EntryTypeEnum::Feed,
        ], $this->em);
        EntryFactory::make([
            'user' => $user,
            'entityId' => $entityId2,
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entry-counts?filter[entityIds][]=' . $entityId2->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals($entityId2->toString(), $result['json'][0]['entityId']);
    }

    final public function testFilterType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);
        EntryFactory::make([
            'user' => $user,
            'entityId' => Uuid::v4(),
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entry-counts?filter[type]=' . EntryTypeEnum::Feed->value, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals(EntryTypeEnum::Feed->value, $result['json'][0]['type']);
    }

    final public function testInvalidParams(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/entry-counts?page=abc', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('page', $result['json']['errors']);
    }
}
