<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\FeedReactionResource;
use Tests\Factory\{FeedFactory, FeedReactionFactory, UserFactory};

class FeedReactionResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $reaction = self::persisted(FeedReactionFactory::make([
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));

        $data = FeedReactionResource::fromEntity($reaction);

        $this->assertSame([
            'id' => $reaction->id,
            'feedId' => $reaction->feed->id,
            'userId' => $reaction->user->id,
            'createdAt' => self::formatDate($reaction->createdAt),
            'updatedAt' => self::formatDate($reaction->updatedAt),
            'reaction' => $reaction->reaction,
            'status' => $reaction->status,
        ], $data);
        $this->assertMatchesSchema(FeedReactionResource::class, $data);
    }
}
