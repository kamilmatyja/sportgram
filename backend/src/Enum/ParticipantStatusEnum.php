<?php

namespace App\Enum;

enum ParticipantStatusEnum: int
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
}
