<?php

namespace App\Event;

use App\Entity\User;
use App\Entity\UserPasswordReset;
use Symfony\Contracts\EventDispatcher\Event;

class UserPasswordResetEmailEvent extends Event
{
    public function __construct(
        private readonly User $user,
        private readonly UserPasswordReset $userPasswordReset
    ) {
    }

    final public function getUser(): User
    {
        return $this->user;
    }

    final public function getUserPasswordReset(): UserPasswordReset
    {
        return $this->userPasswordReset;
    }
}

