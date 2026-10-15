<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Event\UserPasswordResetEmailEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\Event;
use Tests\Factory\{UserFactory, UserPasswordResetFactory};

class UserPasswordResetEmailEventTest extends TestCase
{
    final public function testExposesUserAndUserPasswordReset(): void
    {
        $user = UserFactory::make();
        $userPasswordReset = UserPasswordResetFactory::make(['user' => $user]);

        $event = new UserPasswordResetEmailEvent($user, $userPasswordReset);

        $this->assertInstanceOf(Event::class, $event);
        $this->assertSame($user, $event->getUser());
        $this->assertSame($userPasswordReset, $event->getUserPasswordReset());
    }
}
