<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{ConversationActivity, User};
use PHPUnit\Framework\TestCase;

class ConversationActivityTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createStub(User::class);
        $receiver = $this->createStub(User::class);
        $entity = new ConversationActivity($sender, $receiver);
        $this->assertInstanceOf(ConversationActivity::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
    }
}
