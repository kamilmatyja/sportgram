<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, FriendStatusEnum, RoleEnum};
use Tests\Factory\{FeedFactory, FriendFactory};

class FeedIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feed_reactions');
        $this->truncate('feed_comments');
        $this->truncate('feeds');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testShowsOwnAndFriendsFeedsOnly(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $friend = self::createUser(RoleEnum::Participant);
        $stranger = self::createUser(RoleEnum::Participant);

        FriendFactory::make(
            ['senderUser' => $user, 'receiverUser' => $friend, 'status' => FriendStatusEnum::Accepted],
            $this->em,
        );

        FeedFactory::make(['user' => $user], $this->em);
        FeedFactory::make(['user' => $friend], $this->em);
        FeedFactory::make(['user' => $stranger], $this->em);

        $result = $this->get('/api/feeds', $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);
    }

    final public function testFiltersAndSorting(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        FeedFactory::make(['user' => $user, 'text' => 'Hello World', 'status' => ElementStatusEnum::Active], $this->em);
        FeedFactory::make(['user' => $user, 'text' => 'Goodbye', 'status' => ElementStatusEnum::Active], $this->em);
        FeedFactory::make(['user' => $user, 'text' => 'Hidden World', 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->get('/api/feeds?filter[text]=World&filter[status]=2', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals('Hello World', $result['json'][0]['text']);

        $resultSort = $this->get('/api/feeds?filter[status]=2&sort=text:asc', $user);
        $this->assertEquals(200, $resultSort['status']);
        $this->assertEquals('Goodbye', $resultSort['json'][0]['text']);
        $this->assertEquals('Hello World', $resultSort['json'][1]['text']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            FeedFactory::make(['user' => $user], $this->em);
        }

        $result = $this->get('/api/feeds?page=2&limit=5', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
