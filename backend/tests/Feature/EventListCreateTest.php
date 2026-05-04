<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{EventDisciplineDistanceFactory, EventDisciplineFactory, EventFactory, PageFactory, PageParticipantFactory};

class EventListCreateTest extends ApiTestCase
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
        $result = $this->post("/api/event-discipline-distances/{$id}", []);
        $this->assertEquals(401, $result['status']);
    }

    final public function testForbiddenRole(): void
    {
        // endpoint requires ROLE_PARTICIPANT
        $admin = self::createUser(RoleEnum::Administrator);
        $id = Uuid::v4()->toString();

        $result = $this->post("/api/event-discipline-distances/{$id}", [], $admin);
        $this->assertEquals(403, $result['status']);
    }

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $id = Uuid::v4()->toString();

        $result = $this->post("/api/event-discipline-distances/{$id}", [], $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $eventCreator = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $eventCreator], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $eventCreator], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant], $this->em);
        $discipline = EventDisciplineFactory::make(['event' => $event], $this->em);
        $distance = EventDisciplineDistanceFactory::make(['eventDiscipline' => $discipline], $this->em);

        $result = $this->post("/api/event-discipline-distances/{$distance->id->toString()}", [], $user);

        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
