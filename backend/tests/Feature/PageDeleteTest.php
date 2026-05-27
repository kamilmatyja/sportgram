<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{PageFactory, PageParticipantFactory};

class PageDeleteTest extends ApiTestCase
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

        $page = PageFactory::make(['user' => $owner], $this->em);

        $result = $this->delete("/api/pages/{$page->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testCannotDeletePageWithParticipants(): void
    {
        $user = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $user], $this->em);

        PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);

        $result = $this->delete("/api/pages/{$page->id->toString()}", $user);

        $this->assertEquals(409, $result['status']);
        $this->assertEquals('Cannot delete page with participants.', $result['json']['error']);
    }

    final public function testSuccess(): void
    {
        $user = self::createUser(RoleEnum::Organizer);
        $page = PageFactory::make(['user' => $user], $this->em);

        $result = $this->delete("/api/pages/{$page->id->toString()}", $user);
        $this->assertEquals(200, $result['status']);
    }
}
