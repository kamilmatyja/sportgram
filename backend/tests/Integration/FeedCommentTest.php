<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Feed, FeedComment, User};
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\TestCase;

class FeedCommentTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $text = 'Comment text';
        $status = ElementStatusEnum::Active;
        $entity = new FeedComment($feed, $user, $text, $status);
        $this->assertInstanceOf(FeedComment::class, $entity);
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($user, $entity->user);
        $this->assertSame($text, $entity->text);
        $this->assertSame($status, $entity->status);
    }
}
