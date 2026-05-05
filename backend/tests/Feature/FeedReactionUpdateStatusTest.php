<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\FeedReactionFactory;

class FeedReactionUpdateStatusTest extends ApiTestCase
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

        $reaction = FeedReactionFactory::make(
            ['user' => $reactionOwner, 'status' => ElementStatusEnum::Draft],
            $this->em,
        );

        $result = $this->patch("/api/feed-reactions/{$reaction->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $reactionOwner = self::createUser(RoleEnum::Participant);
        $admin = self::createUser(RoleEnum::Administrator);

        $reaction = FeedReactionFactory::make(
            ['user' => $reactionOwner, 'status' => ElementStatusEnum::Draft],
            $this->em,
        );

        $result = $this->patch("/api/feed-reactions/{$reaction->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $reactionOwner = self::createUser(RoleEnum::Participant);
        $reaction = FeedReactionFactory::make(
            ['user' => $reactionOwner, 'status' => ElementStatusEnum::Draft],
            $this->em,
        );

        $result = $this->patch(
            "/api/feed-reactions/{$reaction->id->toString()}/status",
            ['status' => 2],
            $reactionOwner,
        );
        $this->assertEquals(200, $result['status']);
    }
}
