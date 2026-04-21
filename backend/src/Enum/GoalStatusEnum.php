<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum GoalStatusEnum: int
{
    use EnumValuesTrait;

    case Draft = 1;
    case Active = 2;
    case Completed = 3;
    case Rejected = 4;
}
