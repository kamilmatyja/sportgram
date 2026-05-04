<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventDisciplineSubDistanceFactory, EventFactory, PageFactory, PageParticipantFactory};

class EventDetailsTest extends ApiTestCase
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
        $this->truncate('users');
    }

    final public function testWithoutToken(): void
    {
        $eventId = Uuid::v4()->toString();
        $result = $this->get("/api/events/{$eventId}");
        $this->assertEquals(401, $result['status']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $eventId = Uuid::v4()->toString();

        $result = $this->get("/api/events/{$eventId}", $user);
        $this->assertEquals(404, $result['status']);
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

        $url = "/api/events/{$event->id->toString()}?include[]=eventDisciplines&include[]=eventDisciplineDistances&include[]=eventDisciplineSubDistances";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $json = $result['json'];

        $this->assertArrayHasKey('id', $json);
        $this->assertArrayHasKey('disciplines', $json);
        $this->assertCount(1, $json['disciplines']);

        $this->assertArrayHasKey('distances', $json['disciplines'][0]);
        $this->assertCount(1, $json['disciplines'][0]['distances']);

        $this->assertArrayHasKey('subDistances', $json['disciplines'][0]['distances'][0]);
        $this->assertCount(1, $json['disciplines'][0]['distances'][0]['subDistances']);
    }
}
