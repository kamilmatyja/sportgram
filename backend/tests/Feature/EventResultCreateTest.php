<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineSubDistanceFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory};

class EventResultCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('event_discipline_sub_results');
        $this->truncate('event_discipline_results');
        $this->truncate('feeds');
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
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner, 'status' => SaveStatusEnum::Accepted], $this->em);

        $payload = ['time' => 3600];

        $result = $this->post("/api/event-discipline-distance-lists/{$list->id->toString()}", $payload, $listOwner);
        $this->assertEquals(403, $result['status']);
    }

    final public function testListNotAccepted(): void
    {
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);

        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner, 'status' => SaveStatusEnum::Pending], $this->em);

        $payload = ['time' => 3600];

        $result = $this->post("/api/event-discipline-distance-lists/{$list->id->toString()}", $payload, $eventCreator);

        $this->assertEquals(409, $result['status']);
        $this->assertArrayHasKey('error', $result['json']);
        $this->assertEquals('Results can only be added to accepted lists.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $subDistance = EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance], $this->em);

        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner, 'status' => SaveStatusEnum::Accepted], $this->em);

        $payload = [
            'time' => 3600,
            'subResults' => [
                [
                    'eventDisciplineSubDistanceId' => $subDistance->id->toString(),
                    'time' => 1800,
                ],
            ],
        ];

        $result = $this->post("/api/event-discipline-distance-lists/{$list->id->toString()}", $payload, $eventCreator);

        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
