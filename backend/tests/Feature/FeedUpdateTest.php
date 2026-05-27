<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\FeedFactory;

class FeedUpdateTest extends ApiTestCase
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

        $payload = [
            'text' => 'Updated post',
            'photo' => base64_encode('new_photo_data'),
        ];

        $result = $this->put("/api/feeds/{$feed->id->toString()}", $payload, $otherUser);
        $this->assertEquals(403, $result['status']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testValidationFailed(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user], $this->em);

        $result = $this->put("/api/feeds/{$feed->id->toString()}", ['text' => ''], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $feed = FeedFactory::make(['user' => $user], $this->em);

        $payload = [
            'text' => 'Updated text',
            'photo' => base64_encode('new_photo_data'),
        ];

        $result = $this->put("/api/feeds/{$feed->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
