<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Friend, User};
use App\Enum\FriendStatusEnum;
use PHPUnit\Framework\TestCase;

class FriendTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createStub(User::class);
        $receiver = $this->createStub(User::class);
        $status = FriendStatusEnum::Pending;
        $entity = new Friend($sender, $receiver, $status);
        $this->assertInstanceOf(Friend::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
        $this->assertSame($status, $entity->status);
    }
}
