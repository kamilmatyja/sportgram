<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\{EventFactory, PageFactory, PageParticipantFactory};

class EventIndexTest extends ApiTestCase
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

    final public function testWithoutToken(): void
    {
        $result = $this->get('/api/events');
        $this->assertEquals(401, $result['status']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        for ($i = 0; $i < 3; ++$i) {
            EventFactory::make(['pageParticipant' => $participant], $this->em);
        }

        $result = $this->get('/api/events', $user);
        $this->assertEquals(200, $result['status']);
        $this->assertCount(3, $result['json']);
    }

    final public function testFilterByStatusAndTitle(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        EventFactory::make(['pageParticipant' => $participant, 'title' => 'Marathon Warsaw', 'status' => ElementStatusEnum::Active], $this->em);
        EventFactory::make(['pageParticipant' => $participant, 'title' => 'Marathon Krakow', 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->get('/api/events?filter[title]=Marathon&filter[status]=1', $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals('Marathon Krakow', $result['json'][0]['title']);
    }

    final public function testSortByTitleDesc(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);
        $participant = PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        EventFactory::make(['pageParticipant' => $participant, 'title' => 'A'], $this->em);
        EventFactory::make(['pageParticipant' => $participant, 'title' => 'Z'], $this->em);
        EventFactory::make(['pageParticipant' => $participant, 'title' => 'M'], $this->em);

        $result = $this->get('/api/events?sort=title:desc', $user);

        $this->assertEquals(200, $result['status']);
        $titles = array_column($result['json'], 'title');
        $this->assertEquals(['Z', 'M', 'A'], $titles);
    }
}
