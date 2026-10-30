<?php

namespace App\Enum;

enum PushSubscriptionStatusEnum: int
{
    case Active = 1;
    case Rejected = 2;
}
