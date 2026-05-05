<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory};

class EventDeleteTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_lists');
        $this->truncate('event_discipline_distances');
        $this->truncate('event_disciplines');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testCannotDeleteEventWithLists(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);

        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);

        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);

        EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $user], $this->em);

        $result = $this->delete("/api/events/{$event->id->toString()}", $user);

        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Cannot delete event with lists.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);

        $result = $this->delete("/api/events/{$event->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
