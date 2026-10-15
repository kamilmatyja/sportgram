<?php

namespace App\Enum;

enum UserStatusEnum: int
{
    case Pending = 1;
    case Accepted = 2;
    case Banned = 3;
}
