<?php

namespace App\Event;

use App\Entity\{User, UserRegister};
use Symfony\Contracts\EventDispatcher\Event;

class UserRegisterEmailEvent extends Event
{
    public function __construct(
        private readonly User $user,
        private readonly UserRegister $userRegister,
    ) {
    }

    final public function getUser(): User
    {
        return $this->user;
    }

    final public function getUserRegister(): UserRegister
    {
        return $this->userRegister;
    }
}
