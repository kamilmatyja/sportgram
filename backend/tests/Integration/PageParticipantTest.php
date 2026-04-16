<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Page, PageParticipant, User};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class PageParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $page = $this->createMock(Page::class);
        $user = $this->createMock(User::class);
        $status = SaveStatusEnum::Pending;
        $entity = new PageParticipant($page, $user, $status);
        $this->assertInstanceOf(PageParticipant::class, $entity);
        $this->assertSame($page, $entity->page);
        $this->assertSame($user, $entity->user);
        $this->assertSame($status, $entity->status);
    }
}
