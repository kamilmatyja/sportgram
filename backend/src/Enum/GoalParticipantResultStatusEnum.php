<?php

namespace App\Enum;

enum GoalParticipantResultStatusEnum: int
{
    case Submitted = 1;
    case Verified = 2;
    case Rejected = 3;
}
