<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum PushSubscriptionStatusEnum: int
{
    use EnumValuesTrait;

    case Active = 1;
    case Inactive = 2;
    case Revoked = 3;
}
