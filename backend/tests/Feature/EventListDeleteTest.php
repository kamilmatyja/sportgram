<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineListFactory, EventFactory, PageFactory, PageParticipantFactory};

class EventListDeleteTest extends ApiTestCase
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
        $result = $this->delete("/api/event-discipline-distance-lists/{$id}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenForListOwnerOnly(): void
    {
        // EventListCreatorVoter allows ONLY the event creator to delete lists (not the list owner)
        $listOwner = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner], $this->em);

        $result = $this->delete("/api/event-discipline-distance-lists/{$list->id->toString()}", $listOwner);
        $this->assertEquals(403, $result['status']);
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
        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $listOwner], $this->em);

        $result = $this->delete("/api/event-discipline-distance-lists/{$list->id->toString()}", $eventCreator);
        $this->assertEquals(200, $result['status']);
    }
}
