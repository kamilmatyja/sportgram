<?php

namespace App\Enum;

enum PushSubscriptionStatusEnum: int
{
    case Active = 1;
    case Inactive = 2;
    case Revoked = 3;
}
