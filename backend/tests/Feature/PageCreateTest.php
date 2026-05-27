<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\UserFactory;

class PageCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('friends');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $payload = [
            'title' => 'My Page',
            'description' => 'Description',
            'link' => 'my-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
        ];

        $result = $this->post('/api/pages', $payload);
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForParticipant(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $payload = [
            'title' => 'My Page',
            'description' => 'Description',
            'link' => 'my-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
        ];

        $result = $this->post('/api/pages', $payload, $user);
        $this->assertEquals(403, $result['status']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Organizer);

        $result = $this->post('/api/pages', [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);

        $expected = ['title', 'description', 'link', 'profilePhoto', 'backgroundPhoto', 'color'];
        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
        }
    }

    final public function testAddNonFriendParticipant(): void
    {
        $user = self::createUser(RoleEnum::Organizer);
        $stranger = UserFactory::make(em: $this->em);

        $payload = [
            'title' => 'My Page',
            'description' => 'Description',
            'link' => 'my-page-1',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
            'participants' => [$stranger->id->toString()],
        ];

        $result = $this->post('/api/pages', $payload, $user);
        $this->assertEquals(409, $result['status']);
        $this->assertEquals('User is not friend.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Organizer);

        $payload = [
            'title' => 'My Page',
            'description' => 'Description',
            'link' => 'my-unique-page',
            'profilePhoto' => base64_encode('photo'),
            'backgroundPhoto' => base64_encode('bg'),
            'color' => 1,
        ];

        $result = $this->post('/api/pages', $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
