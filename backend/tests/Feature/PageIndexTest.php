<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\{PageFactory, PageParticipantFactory};

class PageIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows');
        $this->truncate('events');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/pages');
        $this->assertEquals(401, $result['status']);
    }

    final public function testSuccessWithFilters(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        $page1 = PageFactory::make(
            ['user' => $user, 'title' => 'Page A', 'link' => 'link-a', 'status' => ElementStatusEnum::Active],
            $this->em,
        );
        PageParticipantFactory::make(['page' => $page1, 'user' => $user], $this->em);

        $page2 = PageFactory::make(
            ['user' => $user, 'title' => 'Page B', 'link' => 'link-b', 'status' => ElementStatusEnum::Draft],
            $this->em,
        );
        PageParticipantFactory::make(['page' => $page2, 'user' => $user], $this->em);

        $result = $this->get(
            "/api/pages?filter[userId]={$user->id->toString()}&filter[status]=" . ElementStatusEnum::Active->value,
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals('Page A', $result['json'][0]['title']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);

        for ($i = 0; $i < 15; $i++) {
            $page = PageFactory::make(['user' => $user], $this->em);
            PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        }

        $result = $this->get("/api/pages?filter[userId]={$user->id->toString()}&page=2&limit=5", $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
