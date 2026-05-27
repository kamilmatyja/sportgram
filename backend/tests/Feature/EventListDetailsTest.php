<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{EventDisciplineDistanceFactory,
    EventDisciplineFactory,
    EventDisciplineListFactory,
    EventDisciplineResultFactory,
    EventDisciplineSubDistanceFactory,
    EventDisciplineSubResultFactory,
    EventFactory,
    PageFactory,
    PageParticipantFactory};

class EventListDetailsTest extends ApiTestCase
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

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);
        $subDistance = EventDisciplineSubDistanceFactory::make(['eventDisciplineDistance' => $distance], $this->em);

        $list = EventDisciplineListFactory::make(['eventDisciplineDistance' => $distance, 'user' => $user], $this->em);

        $resultEntity = EventDisciplineResultFactory::make(['eventDisciplineList' => $list, 'user' => $user], $this->em);

        EventDisciplineSubResultFactory::make([
            'eventDisciplineSubDistance' => $subDistance,
            'eventDisciplineResult' => $resultEntity,
            'user' => $user,
        ], $this->em);

        $url = "/api/event-discipline-distance-lists/{$list->id->toString()}?include[]=eventListResults&include[]=eventListSubResults";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $this->assertArrayHasKey('id', $json);
        $this->assertArrayHasKey('results', $json);
        $this->assertCount(1, $json['results']);

        $this->assertArrayHasKey('subResults', $json['results'][0]);
        $this->assertCount(1, $json['results'][0]['subResults']);
    }
}
