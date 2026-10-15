<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Conversation, User};
use App\Enum\ConversationStatusEnum;
use PHPUnit\Framework\TestCase;

class ConversationTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $sender = $this->createStub(User::class);
        $receiver = $this->createStub(User::class);
        $text = 'test message';
        $status = ConversationStatusEnum::Sent;
        $entity = new Conversation($sender, $receiver, $text, $status);
        $this->assertInstanceOf(Conversation::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
        $this->assertSame($text, $entity->text);
        $this->assertSame($status, $entity->status);
    }
}
