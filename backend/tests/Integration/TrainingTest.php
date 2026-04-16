<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Feed, Training, User};
use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class TrainingTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $startedAt = new DateTimeImmutable('-1 hour');
        $endedAt = new DateTimeImmutable('+1 hour');
        $title = 'Training title';
        $description = 'desc';
        $link = 'training-link';
        $location = 'location';
        $status = ElementStatusEnum::Active;
        $entity = new Training($feed, $user, $startedAt, $endedAt, $title, $description, $link, $location, $status);
        $this->assertInstanceOf(Training::class, $entity);
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($startedAt, $entity->getStartedAt());
        $this->assertSame($endedAt, $entity->getEndedAt());
        $this->assertSame($title, $entity->getTitle());
        $this->assertSame($description, $entity->getDescription());
        $this->assertSame($link, $entity->getLink());
        $this->assertSame($location, $entity->getLocation());
        $this->assertSame($status, $entity->getStatus());
    }
}
