<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Page, PageFollow, User};
use App\Enum\PageFollowStatusEnum;
use PHPUnit\Framework\TestCase;

class PageFollowTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $page = $this->createMock(Page::class);
        $user = $this->createMock(User::class);
        $status = PageFollowStatusEnum::Accepted;
        $entity = new PageFollow($page, $user, $status);
        $this->assertInstanceOf(PageFollow::class, $entity);
        $this->assertSame($page, $entity->getPage());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($status, $entity->getStatus());
    }
}
