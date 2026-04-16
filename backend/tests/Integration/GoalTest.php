<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\{Feed, Goal, User};
use App\Enum\{DisciplineEnum, GoalStatusEnum};
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class GoalTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $feed = $this->createMock(Feed::class);
        $user = $this->createMock(User::class);
        $startedAt = new DateTimeImmutable('-1 day');
        $endedAt = new DateTimeImmutable('+1 day');
        $text = 'Goal text';
        $link = 'goal-link';
        $discipline = DisciplineEnum::Running;
        $distance = 10000;
        $time = 3600;
        $status = GoalStatusEnum::Active;
        $entity = new Goal($feed, $user, $startedAt, $endedAt, $text, $link, $discipline, $distance, $time, $status);
        $this->assertInstanceOf(Goal::class, $entity);
        $this->assertSame($feed, $entity->getFeed());
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($startedAt, $entity->getStartedAt());
        $this->assertSame($endedAt, $entity->getEndedAt());
        $this->assertSame($text, $entity->getText());
        $this->assertSame($link, $entity->getLink());
        $this->assertSame($discipline, $entity->getDiscipline());
        $this->assertSame($distance, $entity->getDistance());
        $this->assertSame($time, $entity->getTime());
        $this->assertSame($status, $entity->getStatus());
    }
}
