<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\{EventFactory, PageFactory, PageParticipantFactory};

class EventUpdateStatusTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
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
        $event = EventFactory::make(['pageParticipant' => $participant, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/events/{$event->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $admin = self::createUser(RoleEnum::Administrator);
        $otherUser = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $otherUser], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $otherUser], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/events/{$event->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsParticipant(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        $event = EventFactory::make(['pageParticipant' => $participant, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/events/{$event->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
