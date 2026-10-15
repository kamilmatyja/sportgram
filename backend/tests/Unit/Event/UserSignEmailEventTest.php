<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Event\UserSignEmailEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\Event;
use Tests\Factory\{UserFactory, UserSignFactory};

class UserSignEmailEventTest extends TestCase
{
    final public function testExposesUserAndUserSign(): void
    {
        $user = UserFactory::make();
        $userSign = UserSignFactory::make(['user' => $user]);

        $event = new UserSignEmailEvent($user, $userSign);

        $this->assertInstanceOf(Event::class, $event);
        $this->assertSame($user, $event->getUser());
        $this->assertSame($userSign, $event->getUserSign());
    }
}
