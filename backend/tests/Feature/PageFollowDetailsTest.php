<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageFollowFactory};

class PageFollowDetailsTest extends ApiTestCase
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

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $followId = Uuid::v4()->toString();

        $result = $this->get("/api/page-follows/{$followId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccess(): void
    {
        $followerUser = self::createUser(RoleEnum::Participant);
        $pageOwner = self::createUser(RoleEnum::Organizer);

        $page = PageFactory::make(['user' => $pageOwner], $this->em);
        $follow = PageFollowFactory::make(['page' => $page, 'user' => $followerUser], $this->em);

        $result = $this->get("/api/page-follows/{$follow->id->toString()}", $followerUser);

        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertEquals($followerUser->id->toString(), $result['json']['userId']);
    }
}
