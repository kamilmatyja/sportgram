<?php

namespace App\Enum;

enum NotificationStatusEnum: int
{
    case NotSent = 1;
    case Sent = 2;
    case Read = 3;
}
