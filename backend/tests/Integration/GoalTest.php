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
        $this->assertSame($feed, $entity->feed);
        $this->assertSame($user, $entity->user);
        $this->assertSame($startedAt, $entity->startedAt);
        $this->assertSame($endedAt, $entity->endedAt);
        $this->assertSame($text, $entity->text);
        $this->assertSame($link, $entity->link);
        $this->assertSame($discipline, $entity->discipline);
        $this->assertSame($distance, $entity->distance);
        $this->assertSame($time, $entity->time);
        $this->assertSame($status, $entity->status);
    }
}
