<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Enum\NotificationTypeEnum;
use App\Event\NotificationEvent;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Tests\Factory\UserFactory;

class NotificationEventTest extends TestCase
{
    final public function testExposesUserTypeAndLink(): void
    {
        $user = UserFactory::make();

        $event = new NotificationEvent($user, NotificationTypeEnum::GoalResult, 'Goal', '/goals/my-goal');

        $this->assertSame($user, $event->getUser());
        $this->assertSame(NotificationTypeEnum::GoalResult, $event->getType());
        $this->assertSame('/goals/my-goal', $event->getLink());
    }

    final public function testLinkIsOptional(): void
    {
        $event = new NotificationEvent(UserFactory::make(), NotificationTypeEnum::GoalResult, 'Goal', null);

        $this->assertNull($event->getLink());
    }

    #[DataProvider('textProvider')]
    final public function testText(?string $text, string $expected): void
    {
        $event = new NotificationEvent(UserFactory::make(), NotificationTypeEnum::GoalResult, $text, null);

        $this->assertSame($expected, $event->getText());
    }

    public static function textProvider(): iterable
    {
        yield 'given text' => ['Goal reached', 'Goal reached'];
        yield 'missing text falls back to dash' => [null, '-'];
    }
}
