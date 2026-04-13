<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Page;
use App\Entity\PageParticipant;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class PageParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $page = $this->createMock(Page::class);
        $user = $this->createMock(User::class);
        $entity = new PageParticipant($page, $user);
        $this->assertInstanceOf(PageParticipant::class, $entity);
        $this->assertSame($page, $entity->getPage());
        $this->assertSame($user, $entity->getUser());
    }
}

