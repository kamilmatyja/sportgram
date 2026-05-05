<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory};

class EventListUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('feeds');
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

    final public function testUnauthorized(): void
    {
        $id = Uuid::v4()->toString();
        $result = $this->patch("/api/event-discipline-distance-lists/{$id}/status", ['status' => 2]);
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbidden(): void
    {
        $randomUser = self::createUser(RoleEnum::Participant);
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner], $this->em);

        $result = $this->patch(
            "/api/event-discipline-distance-lists/{$list->id->toString()}/status",
            ['status' => 2],
            $randomUser,
        );
        $this->assertEquals(403, $result['status']);
    }

    final public function testValidationFailed(): void
    {
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $eventCreator], $this->em);

        $result = $this->patch(
            "/api/event-discipline-distance-lists/{$list->id->toString()}/status",
            ['status' => 999],
            $eventCreator,
        );
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testSuccessByEventCreator(): void
    {
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner, 'status' => SaveStatusEnum::Pending], $this->em);

        $result = $this->patch(
            "/api/event-discipline-distance-lists/{$list->id->toString()}/status",
            ['status' => 2],
            $eventCreator,
        );
        $this->assertEquals(200, $result['status']);
    }
}
