<?php

declare(strict_types=1);

namespace Tests\Integration\Entity;

use App\Entity\{Feed, Training, User};
use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class TrainingTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $feed = $this->createStub(Feed::class);
        $user = $this->createStub(User::class);
        $startedAt = new DateTimeImmutable('-1 hour');
        $endedAt = new DateTimeImmutable('+1 hour');
        $title = 'Training title';
        $description = 'desc';
        $link = 'training-link';
        $location = 'location';
        $status = ElementStatusEnum::Active;
        $entity = new Training($feed, $user, $startedAt, $endedAt, $title, $description, $link, $location, $status);
        $this->assertInstanceOf(Training::class, $entity);
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($user, $entity->user);
        $this->assertSame($startedAt, $entity->startedAt);
        $this->assertSame($endedAt, $entity->endedAt);
        $this->assertSame($title, $entity->title);
        $this->assertSame($description, $entity->description);
        $this->assertSame($link, $entity->link);
        $this->assertSame($location, $entity->location);
        $this->assertSame($status, $entity->status);
    }
}
