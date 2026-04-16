<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Friend, User};
use App\Enum\FriendStatusEnum;
use PHPUnit\Framework\TestCase;

class FriendTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createMock(User::class);
        $receiver = $this->createMock(User::class);
        $status = FriendStatusEnum::Pending;
        $entity = new Friend($sender, $receiver, $status);
        $this->assertInstanceOf(Friend::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
        $this->assertSame($status, $entity->status);
    }
}
