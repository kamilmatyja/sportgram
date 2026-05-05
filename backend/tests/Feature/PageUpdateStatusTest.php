<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\{ElementStatusEnum, RoleEnum};
use Tests\Factory\PageFactory;

class PageUpdateStatusTest extends ApiTestCase
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

    final public function testForbiddenForOtherUser(): void
    {
        $owner = self::createUser(RoleEnum::Organizer);
        $otherUser = self::createUser(RoleEnum::Organizer);

        $page = PageFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/pages/{$page->id->toString()}/status", ['status' => 2], $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsAdmin(): void
    {
        $owner = self::createUser(RoleEnum::Organizer);
        $admin = self::createUser(RoleEnum::Administrator);

        $page = PageFactory::make(['user' => $owner, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/pages/{$page->id->toString()}/status", ['status' => 2], $admin);
        $this->assertEquals(200, $result['status']);
    }

    final public function testSuccessAsOwner(): void
    {
        $user = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $user, 'status' => ElementStatusEnum::Draft], $this->em);

        $result = $this->patch("/api/pages/{$page->id->toString()}/status", ['status' => 2], $user);
        $this->assertEquals(200, $result['status']);
    }
}
