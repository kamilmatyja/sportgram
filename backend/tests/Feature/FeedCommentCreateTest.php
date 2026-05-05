<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{FriendStatusEnum, RoleEnum};
use Tests\Factory\{FeedFactory, FriendFactory};

class FeedCommentCreateTest extends ApiTestCase
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

    final public function testValidationFailed(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user], $this->em);

        $result = $this->post("/api/feeds/{$feed->id->toString()}/comments", ['text' => ''], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
    }

    final public function testNotFriend(): void
    {
        $feedOwner = self::createUser(RoleEnum::Participant);
        $stranger = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $feedOwner], $this->em);

        $result = $this->post("/api/feeds/{$feed->id->toString()}/comments", ['text' => 'Nice!'], $stranger);
        $this->assertEquals(409, $result['status']);
        $this->assertEquals('User is not friend.', $result['json']['error']);
    }

    final public function testSuccessAsFriend(): void
    {
        $feedOwner = self::createUser(RoleEnum::Participant);
        $friend = self::createUser(RoleEnum::Participant);

        FriendFactory::make(
            ['senderUser' => $feedOwner, 'receiverUser' => $friend, 'status' => FriendStatusEnum::Accepted],
            $this->em,
        );

        $feed = FeedFactory::make(['user' => $feedOwner], $this->em);

        $result = $this->post("/api/feeds/{$feed->id->toString()}/comments", ['text' => 'Awesome post!'], $friend);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
