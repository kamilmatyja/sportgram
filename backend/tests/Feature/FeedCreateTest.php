<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;

class FeedCreateTest extends ApiTestCase
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

    final public function testUnauthorized(): void
    {
        $payload = [
            'text' => 'My new post',
            'photo' => base64_encode('photo_data'),
        ];

        $result = $this->post('/api/feeds', $payload);
        $this->assertEquals(401, $result['status']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $result = $this->post('/api/feeds', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $this->assertArrayHasKey('text', $result['json']['errors']);
        $this->assertArrayHasKey('photo', $result['json']['errors']);
        $this->assertEquals(['This value should not be blank.'], $result['json']['errors']['text']);
    }

    final public function testInvalidBase64Photo(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'text' => 'My new post',
            'photo' => 'invalid-base64-string!',
        ];

        $result = $this->post('/api/feeds', $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('photo', $result['json']['errors']);
        $this->assertEquals(['This value should be a valid base64 string.'], $result['json']['errors']['photo']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'text' => 'This is a successful post creation',
            'photo' => base64_encode('valid_photo_data'),
        ];

        $result = $this->post('/api/feeds', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
