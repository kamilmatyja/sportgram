<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{CountryEnum, GenderEnum, RoleEnum, UserStatusEnum};
use DateTimeImmutable;
use Tests\Factory\UserFactory;

class UserIndexTest extends ApiTestCase
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
        $result = $this->get('/api/users');
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testWithToken(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 3; ++$i) {
            $this->save(UserFactory::make());
        }

        $result = $this->get('/api/users', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertGreaterThanOrEqual(1, count($result['json']));
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; ++$i) {
            $this->save(UserFactory::make());
        }

        $result = $this->get('/api/users?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }

    final public function testSortFirstName(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['firstName' => 'Adam']);

        $u1 = UserFactory::make(['firstName' => 'Kamil']);
        $u2 = UserFactory::make(['firstName' => 'Janusz']);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=firstName:asc', $user);
        $this->assertEquals(200, $result['status']);
        $names = array_column($result['json'], 'firstName');
        $this->assertEquals(['Adam', 'Janusz', 'Kamil'], array_slice($names, 0, 3));
    }

    final public function testSortLastName(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['lastName' => 'Adamczyk']);

        $u1 = UserFactory::make(['lastName' => 'Kowalski']);
        $u2 = UserFactory::make(['lastName' => 'Baran']);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=lastName:asc', $user);
        $this->assertEquals(200, $result['status']);
        $names = array_column($result['json'], 'lastName');
        $this->assertEquals(['Adamczyk', 'Baran', 'Kowalski'], array_slice($names, 0, 3));
    }

    final public function testSortGender(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['gender' => GenderEnum::Male]);

        $u1 = UserFactory::make(['gender' => GenderEnum::Female]);
        $u2 = UserFactory::make(['gender' => GenderEnum::Male]);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=gender:asc', $user);
        $this->assertEquals(200, $result['status']);
        $genders = array_column($result['json'], 'gender');
        $this->assertEquals([1, 1, 2], array_slice($genders, 0, 3));
    }

    final public function testSortCountry(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['country' => CountryEnum::Andorra]);

        $u1 = UserFactory::make(['country' => CountryEnum::Austria]);
        $u2 = UserFactory::make(['country' => CountryEnum::Albania]);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=country:asc', $user);
        $this->assertEquals(200, $result['status']);
        $countries = array_column($result['json'], 'country');
        $this->assertEquals([1, 2, 3], array_slice($countries, 0, 3));
    }

    final public function testSortBirthAt(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['birthAt' => new DateTimeImmutable('2000-01-01')]);

        $u1 = UserFactory::make(['birthAt' => new DateTimeImmutable('1990-01-01')]);
        $u2 = UserFactory::make(['birthAt' => new DateTimeImmutable('2010-01-01')]);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=birthAt:asc', $user);
        $this->assertEquals(200, $result['status']);
        $births = array_column($result['json'], 'birthAt');
        $this->assertEquals(
            ['1990-01-01', '2000-01-01', '2010-01-01'],
            array_map(fn ($d) => substr($d, 0, 10), array_slice($births, 0, 3)),
        );
    }

    final public function testSortStatus(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['status' => UserStatusEnum::Accepted]);

        $u1 = UserFactory::make(['status' => UserStatusEnum::Pending]);
        $u2 = UserFactory::make(['status' => UserStatusEnum::Banned]);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?sort=status:asc', $user);
        $this->assertEquals(200, $result['status']);
        $statuses = array_column($result['json'], 'status');
        $this->assertEquals([1, 2, 3], array_slice($statuses, 0, 3));
    }

    final public function testFilterFirstName(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['firstName' => 'Bartek']);

        $u1 = UserFactory::make(['firstName' => 'Adam']);
        $u2 = UserFactory::make(['firstName' => 'Bartek']);

        $this->save($u1);
        $this->save($u2);

        $result = $this->get('/api/users?filter[firstName]=Adam', $user);
        $this->assertEquals(200, $result['status']);
        $names = array_column($result['json'], 'firstName');
        $this->assertContains('Adam', $names);
        $this->assertNotContains('Bartek', $names);
    }

    final public function testFilterLastName(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['lastName' => 'Kowalski']);
        $u1 = UserFactory::make(['lastName' => 'Nowak']);
        $u2 = UserFactory::make(['lastName' => 'Kowalski']);
        $this->save($u1);
        $this->save($u2);
        $result = $this->get('/api/users?filter[lastName]=Nowak', $user);
        $this->assertEquals(200, $result['status']);
        $names = array_column($result['json'], 'lastName');
        $this->assertContains('Nowak', $names);
        $this->assertNotContains('Kowalski', $names);
    }

    final public function testFilterGender(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['gender' => GenderEnum::Female]);
        $u1 = UserFactory::make(['gender' => GenderEnum::Male]);
        $u2 = UserFactory::make(['gender' => GenderEnum::Female]);
        $this->save($u1);
        $this->save($u2);
        $result = $this->get('/api/users?filter[gender]=1', $user);
        $this->assertEquals(200, $result['status']);
        $genders = array_column($result['json'], 'gender');
        $this->assertContains(1, $genders);
        $this->assertNotContains(2, $genders);
    }

    final public function testFilterCountry(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['country' => CountryEnum::Andorra]);
        $u1 = UserFactory::make(['country' => CountryEnum::Andorra]);
        $u2 = UserFactory::make(['country' => CountryEnum::Albania]);
        $this->save($u1);
        $this->save($u2);
        $result = $this->get('/api/users?filter[country]=1', $user);
        $this->assertEquals(200, $result['status']);
        $countries = array_column($result['json'], 'country');
        $this->assertContains(1, $countries);
        $this->assertNotContains(2, $countries);
    }

    final public function testFilterStatus(): void
    {
        $user = self::createUser(RoleEnum::Participant, ['status' => UserStatusEnum::Accepted]);
        $u1 = UserFactory::make(['status' => UserStatusEnum::Pending]);
        $u2 = UserFactory::make(['status' => UserStatusEnum::Accepted]);
        $this->save($u1);
        $this->save($u2);
        $result = $this->get('/api/users?filter[status]=1', $user);
        $this->assertEquals(200, $result['status']);
        $statuses = array_column($result['json'], 'status');
        $this->assertContains(1, $statuses);
        $this->assertNotContains(2, $statuses);
    }

    final public function testFilterUserIds(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $u1 = UserFactory::make();
        $u2 = UserFactory::make();

        $this->save($u1);
        $this->save($u2);

        $result = $this->get(
            '/api/users?filter[userIds][]=' . $u1->id->toString() . '&filter[userIds][]=' . $u2->id->toString(),
            $user,
        );
        $this->assertEquals(200, $result['status']);
        $resultIds = array_column($result['json'], 'id');
        $this->assertContains($u1->id->toString(), $resultIds);
        $this->assertContains($u2->id->toString(), $resultIds);
    }

    final public function testFilterLink(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $u1 = UserFactory::make(['link' => 'test-link-1']);
        $u2 = UserFactory::make(['link' => 'test-link-2']);
        $this->save($u1);
        $this->save($u2);
        $result = $this->get('/api/users?filter[link]=test-link-1', $user);
        $this->assertEquals(200, $result['status']);
        $links = array_column($result['json'], 'link');
        $this->assertContains('test-link-1', $links);
        $this->assertNotContains('test-link-2', $links);
    }

    final public function testInvalidParams(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/users?page=abc', $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = [
            'page',
        ];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals([
                'This value should be of type int.',
            ], $result['json']['errors'][$field]);
        }
    }
}
