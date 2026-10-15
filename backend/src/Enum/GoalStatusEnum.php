<?php

namespace App\Enum;

enum GoalStatusEnum: int
{
    case Draft = 1;
    case Active = 2;
    case Completed = 3;
    case Rejected = 4;
}
