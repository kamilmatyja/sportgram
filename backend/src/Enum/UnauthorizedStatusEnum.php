<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum UnauthorizedStatusEnum: int
{
    use EnumValuesTrait;

    case NotSent = 1;
    case Sent = 2;
    case Correct = 3;
    case Incorrect = 4;
}
