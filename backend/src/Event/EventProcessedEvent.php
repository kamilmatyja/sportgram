<?php

namespace App\Event;

use App\Entity\EventDisciplineResult;
use Symfony\Contracts\EventDispatcher\Event;

class EventProcessedEvent extends Event
{
    public function __construct(
        private readonly EventDisciplineResult $result
    ) {
    }

    final public function getResult(): EventDisciplineResult
    {
        return $this->result;
    }
}

