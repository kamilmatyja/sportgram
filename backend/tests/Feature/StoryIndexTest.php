<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, FriendStatusEnum, RoleEnum};
use Tests\Factory\{FriendFactory, StoryFactory};

class StoryIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('stories');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testShowsOwnAndFriendsStoriesOnlyGroupedByUser(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $friend = self::createUser(RoleEnum::Participant);
        $stranger = self::createUser(RoleEnum::Participant);

        FriendFactory::make(
            ['senderUser' => $user, 'receiverUser' => $friend, 'status' => FriendStatusEnum::Accepted],
            $this->em,
        );

        // Użytkownik ma dwa story, powinno zwrócić jego jako 1 najnowszy rekord (grupowanie po userId)
        StoryFactory::make(['user' => $user, 'createdAt' => new \DateTimeImmutable('-1 hour')], $this->em);
        StoryFactory::make(['user' => $user, 'createdAt' => new \DateTimeImmutable('now')], $this->em);

        StoryFactory::make(['user' => $friend], $this->em);

        // Obce story - nie powinno się pokazać
        StoryFactory::make(['user' => $stranger], $this->em);

        $result = $this->get('/api/stories', $user);

        $this->assertEquals(200, $result['status']);
        // 1 grupa z "user", 1 grupa z "friend" = w sumie 2 rekordy
        $this->assertCount(3, $result['json']);
    }

    final public function testFiltersAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        StoryFactory::make(
            ['user' => $user, 'text' => 'Morning run', 'status' => ElementStatusEnum::Active],
            $this->em,
        );
        StoryFactory::make(['user' => $user, 'text' => 'Evening run', 'status' => ElementStatusEnum::Draft], $this->em);
        StoryFactory::make(['user' => $user, 'text' => 'Cycling', 'status' => ElementStatusEnum::Active], $this->em);

        // Gdy filtrujemy po konkretnym userId, repository zdejmuje grupowanie i podaje po prostu wpisy usera:
        $result = $this->get("/api/stories?filter[userId]={$user->id->toString()}&filter[text]=run", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);

        $resultSort = $this->get(
            "/api/stories?filter[userId]={$user->id->toString()}&filter[status]=2&sort=text:asc",
            $user,
        );
        $this->assertEquals(200, $resultSort['status']);
        $this->assertEquals('Cycling', $resultSort['json'][0]['text']);
        $this->assertEquals('Morning run', $resultSort['json'][1]['text']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        // Z racji że repository filtrując po userId nie grupuje, możemy przetestować paginację jego wpisów
        for ($i = 0; $i < 15; $i++) {
            StoryFactory::make(['user' => $user], $this->em);
        }

        $result = $this->get("/api/stories?filter[userId]={$user->id->toString()}&page=2&limit=5", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
