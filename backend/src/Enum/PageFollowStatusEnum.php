<?php

namespace App\Enum;

enum PageFollowStatusEnum: int
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Unfollowed = 4;
}
