<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{ConversationActivity, User};
use PHPUnit\Framework\TestCase;

class ConversationActivityTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createMock(User::class);
        $receiver = $this->createMock(User::class);
        $entity = new ConversationActivity($sender, $receiver);
        $this->assertInstanceOf(ConversationActivity::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
    }
}
