<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventFactory, PageFactory, PageParticipantFactory};

class EventCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_sub_distances');
        $this->truncate('event_discipline_distances');
        $this->truncate('event_disciplines');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('user_disciplines');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $pageId = Uuid::v4()->toString();
        $result = $this->post("/api/event-pages/{$pageId}", []);
        $this->assertEquals(401, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Authentication required.', $result['json']['error']);
    }

    final public function testForbiddenNotParticipant(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $otherUser], $this->em);

        $result = $this->post("/api/event-pages/{$page->id->toString()}", [], $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Access Denied.', $result['json']['error']);
    }

    final public function testEmptyPayload(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);

        $participant = PageParticipantFactory::make([
            'page' => $page,
            'user' => $user,
            'status' => SaveStatusEnum::Accepted,
        ], $this->em);

        $result = $this->post("/api/event-pages/{$page->id->toString()}", [], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('errors', $result['json']);
        $expected = ['startedAt', 'endedAt', 'title', 'description', 'link', 'rules', 'photo', 'location'];

        foreach ($expected as $field) {
            $this->assertArrayHasKey($field, $result['json']['errors']);
            $this->assertEquals(['This value should not be blank.'], $result['json']['errors'][$field]);
        }
    }

    final public function testDuplicateLink(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);

        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $existingEvent = EventFactory::make([
            'pageParticipant' => $participant,
            'link' => 'duplicate-link',
        ], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My event',
            'description' => 'Desc',
            'link' => 'duplicate-link',
            'rules' => 'Rules',
            'photo' => base64_encode('photo'),
            'location' => 'Warsaw',
            'disciplines' => [],
        ];

        $result = $this->post("/api/event-pages/{$page->id->toString()}", $payload, $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('link', $result['json']['errors']);
        $this->assertEquals(['This value is already used.'], $result['json']['errors']['link']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);

        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'My event',
            'description' => 'Desc',
            'link' => 'my-unique-link',
            'rules' => 'Rules',
            'photo' => base64_encode('photo'),
            'location' => 'Warsaw',
            'disciplines' => [
                [
                    'discipline' => 1,
                    'distances' => [
                        [
                            'distance' => 1000,
                            'subDistances' => [
                                ['subDistance' => 500],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = $this->post("/api/event-pages/{$page->id->toString()}", $payload, $user);
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
