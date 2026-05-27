<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\FeedCommentFactory;

class FeedCommentDeleteTest extends ApiTestCase
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

    final public function testForbiddenForOtherUser(): void
    {
        $commentOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $comment = FeedCommentFactory::make(['user' => $commentOwner], $this->em);

        $result = $this->delete("/api/feed-comments/{$comment->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $commentOwner = self::createUser(RoleEnum::Participant);
        $comment = FeedCommentFactory::make(['user' => $commentOwner], $this->em);

        $result = $this->delete("/api/feed-comments/{$comment->id->toString()}", $commentOwner);
        $this->assertEquals(200, $result['status']);
    }
}
