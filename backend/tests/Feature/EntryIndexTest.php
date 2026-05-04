<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{EntryTypeEnum, RoleEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\EntryFactory;

class EntryIndexTest extends ApiTestCase
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
        $result = $this->get('/api/entries');
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 3; ++$i) {
            $entry = EntryFactory::make([
                'user' => $user,
                'entityId' => $user->id,
                'type' => EntryTypeEnum::User,
            ], $this->em);
        }

        $result = $this->get('/api/entries', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(3, $result['json']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; ++$i) {
            $entry = EntryFactory::make([
                'user' => $user,
                'entityId' => $user->id,
                'type' => EntryTypeEnum::User,
            ], $this->em);
        }

        $result = $this->get('/api/entries?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }

    final public function testSortByType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $entry1 = EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);
        $entry2 = EntryFactory::make([
            'user' => $user,
            'entityId' => Uuid::v4(),
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entries?sort=type:desc', $user);
        $this->assertEquals(200, $result['status']);
        $types = array_column($result['json'], 'type');
        $this->assertEquals([EntryTypeEnum::Feed->value, EntryTypeEnum::User->value], array_slice($types, 0, 2));
    }

    final public function testFilterUserId(): void
    {
        $user1 = self::createUser(RoleEnum::Participant);
        $user2 = self::createUser(RoleEnum::Participant);

        $entry1 = EntryFactory::make([
            'user' => $user1,
            'entityId' => $user1->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);
        $entry2 = EntryFactory::make([
            'user' => $user2,
            'entityId' => $user2->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);

        $result = $this->get('/api/entries?filter[userId]=' . $user2->id->toString(), $user1);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals($user2->id->toString(), $result['json'][0]['userId']);
    }

    final public function testFilterEntityIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $entityId1 = Uuid::v4();
        $entityId2 = Uuid::v4();

        $entry1 = EntryFactory::make([
            'user' => $user,
            'entityId' => $entityId1,
            'type' => EntryTypeEnum::Feed,
        ], $this->em);
        $entry2 = EntryFactory::make([
            'user' => $user,
            'entityId' => $entityId2,
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entries?filter[entityIds][]=' . $entityId2->toString(), $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals($entityId2->toString(), $result['json'][0]['entityId']);
    }

    final public function testFilterType(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $entry1 = EntryFactory::make([
            'user' => $user,
            'entityId' => $user->id,
            'type' => EntryTypeEnum::User,
        ], $this->em);
        $entry2 = EntryFactory::make([
            'user' => $user,
            'entityId' => Uuid::v4(),
            'type' => EntryTypeEnum::Feed,
        ], $this->em);

        $result = $this->get('/api/entries?filter[type]=' . EntryTypeEnum::Feed->value, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals(EntryTypeEnum::Feed->value, $result['json'][0]['type']);
    }

    final public function testInvalidParams(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/entries?page=abc', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('page', $result['json']['errors']);
    }
}
