<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Conversation, Friend, User};
use App\Enum\ConversationStatusEnum;
use PHPUnit\Framework\TestCase;

class ConversationTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $friend = $this->createMock(Friend::class);
        $sender = $this->createMock(User::class);
        $receiver = $this->createMock(User::class);
        $text = 'test message';
        $status = ConversationStatusEnum::Sent;
        $entity = new Conversation($friend, $sender, $receiver, $text, $status);
        $this->assertInstanceOf(Conversation::class, $entity);
        $this->assertSame($sender, $entity->senderUser);
        $this->assertSame($receiver, $entity->receiverUser);
        $this->assertSame($text, $entity->text);
        $this->assertSame($status, $entity->status);
    }
}
