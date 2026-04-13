<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\Feed;
use App\Entity\FeedReaction;
use App\Entity\User;
use App\Enum\ElementStatusEnum;
use App\Enum\FeedReactionEnum;
use PHPUnit\Framework\TestCase;

class FeedReactionTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $reaction = FeedReactionEnum::Love;
        $status = ElementStatusEnum::Active;
        $entity = new FeedReaction($feed, $user, $reaction, $status);
        $this->assertInstanceOf(FeedReaction::class, $entity);
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($reaction, $entity->getReaction());
        $this->assertSame($status, $entity->getStatus());
    }
}
