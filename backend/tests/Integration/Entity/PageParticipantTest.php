<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Page, PageParticipant, User};
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\TestCase;

class PageParticipantTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $page = $this->createStub(Page::class);
        $user = $this->createStub(User::class);
        $status = SaveStatusEnum::Pending;
        $entity = new PageParticipant($page, $user, $status);
        $this->assertInstanceOf(PageParticipant::class, $entity);
        $this->assertSame($page, $entity->page);
        $this->assertSame($user, $entity->user);
        $this->assertSame($status, $entity->status);
    }
}
