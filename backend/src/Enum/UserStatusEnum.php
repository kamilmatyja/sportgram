<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum UserStatusEnum: int
{
    use EnumValuesTrait;

    case Pending = 1;
    case Accepted = 2;
    case Banned = 3;
}
