<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{PageFollowStatusEnum, RoleEnum};
use Tests\Factory\{PageFactory, PageParticipantFactory};

class PageFollowCreateTest extends ApiTestCase
{
    final protected function setUp(): void
    {
        parent::setUp();
        $this->truncate('page_follows');
        $this->truncate('page_participants');
        $this->truncate('pages');
        $this->truncate('user_registers');
        $this->truncate('user_roles');
        $this->truncate('users');
    }

    final public function testValidationFailed(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $pageOwner], $this->em);

        $result = $this->post("/api/pages/{$page->id->toString()}/follows", ['status' => 999], $user);
        $this->assertEquals(400, $result['status']);
        $this->assertArrayHasKey('status', $result['json']['errors']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $pageOwner], $this->em);
        // Trzeba dodać participant'a bo event notyfikacji dispatchuje do $page->participants
        PageParticipantFactory::make(['page' => $page, 'user' => $pageOwner], $this->em);

        $result = $this->post(
            "/api/pages/{$page->id->toString()}/follows",
            ['status' => PageFollowStatusEnum::Accepted->value],
            $user,
        );
        $this->assertEquals(201, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
    }
}
