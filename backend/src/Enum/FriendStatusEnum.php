<?php

namespace App\Enum;

enum FriendStatusEnum: int
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Blocked = 4;
}
