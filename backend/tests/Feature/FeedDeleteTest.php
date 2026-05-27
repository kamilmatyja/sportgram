<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\FeedFactory;

class FeedDeleteTest extends ApiTestCase
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
        $feedOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $feed = FeedFactory::make(['user' => $feedOwner], $this->em);

        $result = $this->delete("/api/feeds/{$feed->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user], $this->em);

        $result = $this->delete("/api/feeds/{$feed->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
