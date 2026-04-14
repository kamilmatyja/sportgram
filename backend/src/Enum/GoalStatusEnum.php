<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum GoalStatusEnum: int
{
    use EnumValuesTrait;

    case Draft = 1;
    case Planned = 2;
    case Active = 3;
    case Completed = 4;
    case Rejected = 5;
}
