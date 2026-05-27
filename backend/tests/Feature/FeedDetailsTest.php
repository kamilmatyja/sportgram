<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{FeedCommentFactory, FeedFactory, FeedReactionFactory};

class FeedDetailsTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feed_reactions');
        $this->truncate('feed_comments');
        $this->truncate('feeds');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user], $this->em);

        FeedCommentFactory::make(['feed' => $feed, 'user' => $user], $this->em);
        FeedReactionFactory::make(['feed' => $feed, 'user' => $user], $this->em);

        $url = "/api/feeds/{$feed->id->toString()}?include[]=feedComments&include[]=feedReactions";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertArrayHasKey('comments', $result['json']);
        $this->assertCount(1, $result['json']['comments']);
        $this->assertArrayHasKey('reactions', $result['json']);
        $this->assertCount(1, $result['json']['reactions']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->get('/api/feeds/00000000-0000-0000-0000-000000000000', $user);
        $this->assertEquals(404, $result['status']);
    }
}
