<?php

declare(strict_types=1);

namespace Tests\Unit\Event;

use App\Event\UserRegisterEmailEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Contracts\EventDispatcher\Event;
use Tests\Factory\{UserFactory, UserRegisterFactory};

class UserRegisterEmailEventTest extends TestCase
{
    final public function testExposesUserAndUserRegister(): void
    {
        $user = UserFactory::make();
        $userRegister = UserRegisterFactory::make(['user' => $user]);

        $event = new UserRegisterEmailEvent($user, $userRegister);

        $this->assertInstanceOf(Event::class, $event);
        $this->assertSame($user, $event->getUser());
        $this->assertSame($userRegister, $event->getUserRegister());
    }
}
