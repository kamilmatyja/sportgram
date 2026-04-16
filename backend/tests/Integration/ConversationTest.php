<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Conversation, User};
use App\Enum\ConversationStatusEnum;
use PHPUnit\Framework\TestCase;

class ConversationTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createMock(User::class);
        $receiver = $this->createMock(User::class);
        $text = 'test message';
        $status = ConversationStatusEnum::Sent;
        $entity = new Conversation($sender, $receiver, $text, $status);
        $this->assertInstanceOf(Conversation::class, $entity);
        $this->assertSame($sender, $entity->getSenderUser());
        $this->assertSame($receiver, $entity->getReceiverUser());
        $this->assertSame($text, $entity->getText());
        $this->assertSame($status, $entity->getStatus());
    }
}
