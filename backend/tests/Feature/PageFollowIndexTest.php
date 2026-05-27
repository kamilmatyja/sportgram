<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{PageFollowStatusEnum, RoleEnum};
use Tests\Factory\{PageFactory, PageFollowFactory};

class PageFollowIndexTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testUnauthorized(): void
    {
        $result = $this->get('/api/page-follows');
        $this->assertEquals(401, $result['status']);
    }

    final public function testSuccessWithFilters(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);
        $page1 = PageFactory::make(['user' => $pageOwner], $this->em);

        PageFollowFactory::make(
            ['page' => $page1, 'user' => $user, 'status' => PageFollowStatusEnum::Accepted],
            $this->em,
        );
        PageFollowFactory::make(
            ['page' => $page1, 'user' => $user, 'status' => PageFollowStatusEnum::Pending],
            $this->em,
        );

        $result = $this->get(
            "/api/page-follows?filter[userId]={$user->id->toString()}&filter[status]=" . PageFollowStatusEnum::Accepted->value,
            $user,
        );

        $this->assertEquals(200, $result['status']);
        $this->assertCount(1, $result['json']);
        $this->assertEquals(PageFollowStatusEnum::Accepted->value, $result['json'][0]['status']);
    }

    final public function testPagination(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $pageOwner], $this->em);

        for ($i = 0; $i < 15; $i++) {
            PageFollowFactory::make(['page' => $page, 'user' => $user], $this->em);
        }

        $result = $this->get("/api/page-follows?filter[userId]={$user->id->toString()}&page=2&limit=5", $user);

        $this->assertEquals(200, $result['status']);
        $this->assertCount(5, $result['json']);
    }
}
