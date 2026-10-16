<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\Friend;
use App\Resource\FriendResource;
use Tests\Factory\{FriendFactory, UserFactory};

class FriendResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $friend = $this->friend();

        $data = FriendResource::fromEntity($friend);

        $this->assertSame([
            'id' => $friend->id,
            'senderUserId' => $friend->senderUser->id,
            'receiverUserId' => $friend->receiverUser->id,
            'createdAt' => self::formatDate($friend->createdAt),
            'updatedAt' => self::formatDate($friend->updatedAt),
            'status' => $friend->status,
        ], $data);
        $this->assertNotEquals($data['senderUserId'], $data['receiverUserId']);
        $this->assertMatchesSchema(FriendResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $friends = [$this->friend(), $this->friend()];

        $data = FriendResource::fromEntityCollection($friends);

        $this->assertSame([FriendResource::fromEntity($friends[0]), FriendResource::fromEntity($friends[1])], $data);
        $this->assertSame([], FriendResource::fromEntityCollection([]));
    }

    private function friend(): Friend
    {
        return self::persisted(FriendFactory::make([
            'senderUser' => self::persisted(UserFactory::make()),
            'receiverUser' => self::persisted(UserFactory::make()),
        ]));
    }
}
