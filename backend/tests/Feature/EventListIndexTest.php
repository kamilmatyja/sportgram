<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{RoleEnum, SaveStatusEnum};
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineListFactory, EventFactory, PageFactory, PageParticipantFactory};

class EventListIndexTest extends ApiTestCase
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

    final public function testPaginationAndFilters(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);

        $targetUser = self::createUser(RoleEnum::Participant);

        // Tworzymy 3 listy dla różnych użytkowników, ale 2 dla targetUser (jedna Pending, jedna Accepted)
        EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $user, 'status' => SaveStatusEnum::Pending], $this->em);
        EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $targetUser, 'status' => SaveStatusEnum::Pending], $this->em);
        EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $targetUser, 'status' => SaveStatusEnum::Accepted], $this->em);

        // Filtrujemy tylko dla targetUser
        $result = $this->get("/api/event-discipline-distances/{$distance->id->toString()}?filter[userId]={$targetUser->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(2, $result['json']);

        // Filtrujemy po statusie
        $resultStatus = $this->get("/api/event-discipline-distances/{$distance->id->toString()}?filter[userId]={$targetUser->id->toString()}&filter[status]=2", $user);
        $this->assertEquals(200, $resultStatus['status']);
        $this->assertCount(1, $resultStatus['json']);
        $this->assertEquals(SaveStatusEnum::Accepted->value, $resultStatus['json'][0]['status']);
    }
}
