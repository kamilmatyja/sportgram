<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Feed, User};
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\TestCase;

class FeedTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createStub(User::class);
        $text = 'Feed text';
        $photo = base64_encode(file_get_contents(__DIR__ . '/../../../public/profile.webp'));
        $status = ElementStatusEnum::Active;
        $entity = new Feed($user, $text, $photo, $status);
        $this->assertInstanceOf(Feed::class, $entity);
        $this->assertSame($user, $entity->user);
        $this->assertSame($text, $entity->text);
        $this->assertSame($photo, $entity->photo);
        $this->assertSame($status, $entity->status);
    }
}
