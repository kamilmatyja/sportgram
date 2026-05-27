<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enum\RoleEnum;
use Symfony\Component\Uid\Uuid;
use Tests\Factory\{PageFactory, PageFollowFactory, PageParticipantFactory};

class PageDetailsTest extends ApiTestCase
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

    final public function testNotFound(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $pageId = Uuid::v4()->toString();

        $result = $this->get("/api/pages/{$pageId}", $user);
        $this->assertEquals(404, $result['status']);
    }

    final public function testSuccessWithIncludes(): void
    {
        $user = self::createUser(RoleEnum::Participant);
        $page = PageFactory::make(['user' => $user], $this->em);

        PageParticipantFactory::make(['page' => $page, 'user' => $user], $this->em);
        PageFollowFactory::make(['page' => $page, 'user' => $user], $this->em);

        $url = "/api/pages/{$page->id->toString()}?include[]=pageParticipants&include[]=pageFollows";

        $result = $this->get($url, $user);

        $this->assertEquals(200, $result['status']);
        $this->assertArrayHasKey('id', $result['json']);
        $this->assertArrayHasKey('participants', $result['json']);
        $this->assertCount(1, $result['json']['participants']);
        $this->assertArrayHasKey('follows', $result['json']);
        $this->assertCount(1, $result['json']['follows']);
    }
}
