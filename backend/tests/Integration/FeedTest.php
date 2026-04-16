<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Feed, User};
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\TestCase;

class FeedTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $text = 'Feed text';
        $photo = 'photo_data';
        $status = ElementStatusEnum::Active;
        $entity = new Feed($user, $text, $photo, $status);
        $this->assertInstanceOf(Feed::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($text, $entity->getText());
        $this->assertSame($photo, $entity->getPhoto());
        $this->assertSame($status, $entity->getStatus());
    }
}
