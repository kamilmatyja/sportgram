<?php

namespace App\Enum;

enum GoalStatusEnum: int
{
    case Draft = 1;
    case Planned = 2;
    case Active = 3;
    case Completed = 4;
    case Rejected = 5;
}
