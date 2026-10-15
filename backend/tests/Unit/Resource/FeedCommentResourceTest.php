<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Resource\FeedCommentResource;
use Tests\Factory\{FeedCommentFactory, FeedFactory, UserFactory};

class FeedCommentResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $comment = self::persisted(FeedCommentFactory::make([
            'feed' => self::persisted(FeedFactory::make()),
            'user' => self::persisted(UserFactory::make()),
        ]));

        $data = FeedCommentResource::fromEntity($comment);

        $this->assertSame([
            'id' => $comment->id,
            'feedId' => $comment->feed->id,
            'userId' => $comment->user->id,
            'createdAt' => self::formatDate($comment->createdAt),
            'updatedAt' => self::formatDate($comment->updatedAt),
            'text' => $comment->text,
            'status' => $comment->status,
        ], $data);
        $this->assertMatchesSchema(FeedCommentResource::class, $data);
    }
}
