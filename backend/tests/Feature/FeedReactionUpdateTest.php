<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FeedReactionEnum, RoleEnum};
use Tests\Factory\FeedReactionFactory;

class FeedReactionUpdateTest extends ApiTestCase
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
        $reactionOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $reaction = FeedReactionFactory::make(['user' => $reactionOwner], $this->em);

        $result = $this->put("/api/feed-reactions/{$reaction->id->toString()}", ['type' => 3], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $reactionOwner = self::createUser(RoleEnum::Participant);
        $reaction = FeedReactionFactory::make(
            ['user' => $reactionOwner, 'reaction' => FeedReactionEnum::Like],
            $this->em,
        );

        $result = $this->put(
            "/api/feed-reactions/{$reaction->id->toString()}",
            ['type' => FeedReactionEnum::Love->value],
            $reactionOwner,
        );
        $this->assertEquals(200, $result['status']);
    }
}
