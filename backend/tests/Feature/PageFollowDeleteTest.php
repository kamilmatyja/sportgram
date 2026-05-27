<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Tests\Factory\{PageFactory, PageFollowFactory};

class PageFollowDeleteTest extends ApiTestCase
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

    final public function testForbiddenForOtherUser(): void
    {
        $followerUser = self::createUser(RoleEnum::Participant);
        $otherUser = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);

        $page = PageFactory::make(['user' => $pageOwner], $this->em);
        $follow = PageFollowFactory::make(['page' => $page, 'user' => $followerUser], $this->em);

        $result = $this->delete("/api/page-follows/{$follow->id->toString()}", $otherUser);
        $this->assertEquals(403, $result['status']);
    }

    final public function testSuccessAsFollower(): void
    {
        $followerUser = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);

        $page = PageFactory::make(['user' => $pageOwner], $this->em);
        $follow = PageFollowFactory::make(['page' => $page, 'user' => $followerUser], $this->em);

        $result = $this->delete("/api/page-follows/{$follow->id->toString()}", $followerUser);
        $this->assertEquals(200, $result['status']);
    }
}
