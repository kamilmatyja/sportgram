<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\FeedFactory;

class FeedUpdateStatusTest extends ApiTestCase
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

    final public function testForbiddenForOtherParticipant(): void
    {
        $feedOwner = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $feed = FeedFactory::make(['user' => $feedOwner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/feeds/{$feed->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $feedOwner = self::createUser(RoleEnum::Participant);
        $admin = self::createUser(RoleEnum::Administrator);

        $feed = FeedFactory::make(['user' => $feedOwner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/feeds/{$feed->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/feeds/{$feed->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
