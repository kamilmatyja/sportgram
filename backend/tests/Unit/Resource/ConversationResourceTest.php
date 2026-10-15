<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\Conversation;
use App\Resource\ConversationResource;
use Tests\Factory\{ConversationFactory, UserFactory};

class ConversationResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $conversation = $this->conversation();

        $data = ConversationResource::fromEntity($conversation);

        $this->assertSame([
            'id' => $conversation->id,
            'senderUserId' => $conversation->senderUser->id,
            'receiverUserId' => $conversation->receiverUser->id,
            'createdAt' => self::formatDate($conversation->createdAt),
            'updatedAt' => self::formatDate($conversation->updatedAt),
            'text' => $conversation->text,
            'status' => $conversation->status,
        ], $data);
        $this->assertMatchesSchema(ConversationResource::class, $data);
    }

    final public function testDistinguishesSenderFromReceiver(): void
    {
        $conversation = $this->conversation();

        $data = ConversationResource::fromEntity($conversation);

        $this->assertNotEquals($data['senderUserId'], $data['receiverUserId']);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $conversations = [$this->conversation(), $this->conversation()];

        $data = ConversationResource::fromEntityCollection($conversations);

        $this->assertSame(
            [ConversationResource::fromEntity($conversations[0]), ConversationResource::fromEntity($conversations[1])],
            $data,
        );
        $this->assertSame([], ConversationResource::fromEntityCollection([]));
    }

    private function conversation(): Conversation
    {
        return self::persisted(ConversationFactory::make([
            'senderUser' => self::persisted(UserFactory::make()),
            'receiverUser' => self::persisted(UserFactory::make()),
        ]));
    }
}
