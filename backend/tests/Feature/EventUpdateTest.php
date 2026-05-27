<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum};
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory};

class EventUpdateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_lists');
        $this->truncate('event_discipline_sub_distances');
        $this->truncate('event_discipline_distances');
        $this->truncate('event_disciplines');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testForbidden(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $otherUser], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $otherUser], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);

        $result = $this->put("/api/events/{$event->id->toString()}", [], $user);
        $this->assertEquals(403, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
    }

    final public function testCannotDeleteDistanceWithLists(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);

        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);

        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);

        EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $user], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'Updated title',
            'description' => 'Desc',
            'link' => 'new-link',
            'rules' => 'Rules',
            'photo' => base64_encode('photo'),
            'location' => 'Warsaw',
            'disciplines' => [],
        ];

        $result = $this->put("/api/events/{$event->id->toString()}", $payload, $user);

        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Cannot delete event discipline distance with lists.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);

        $payload = [
            'startedAt' => '2025-01-01T10:00:00',
            'endedAt' => '2025-01-01T12:00:00',
            'title' => 'Updated title',
            'description' => 'Desc',
            'link' => 'updated-link',
            'rules' => 'Rules',
            'photo' => base64_encode('photo'),
            'location' => 'Warsaw',
            'disciplines' => [],
        ];

        $result = $this->put("/api/events/{$event->id->toString()}", $payload, $user);
        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
