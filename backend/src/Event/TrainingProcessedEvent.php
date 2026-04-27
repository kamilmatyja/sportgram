<?php

namespace App\Event;

use App\Entity\TrainingDisciplineDistance;
use App\Entity\User;
use Symfony\Contracts\EventDispatcher\Event;

class TrainingProcessedEvent extends Event
{
    public function __construct(
        private readonly User $user,
        private readonly TrainingDisciplineDistance $result
    ) {
    }

    final public function getUser(): User
    {
        return $this->user;
    }

    final public function getResult(): TrainingDisciplineDistance
    {
        return $this->result;
    }
}

