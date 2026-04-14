<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum NotificationStatusEnum: int
{
    use EnumValuesTrait;

    case NotSent = 1;
    case Sent = 2;
    case Read = 3;
}
