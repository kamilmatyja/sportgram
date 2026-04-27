<?php

namespace App\Event;

use App\Entity\User;
use App\Entity\UserSign;
use Symfony\Contracts\EventDispatcher\Event;

class UserSignEmailEvent extends Event
{
    public function __construct(
        private readonly User $user,
        private readonly UserSign $userSign
    ) {
    }

    final public function getUser(): User
    {
        return $this->user;
    }

    final public function getUserSign(): UserSign
    {
        return $this->userSign;
    }
}

