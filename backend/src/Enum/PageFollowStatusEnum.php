<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum PageFollowStatusEnum: int
{
    use EnumValuesTrait;

    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Unfollowed = 4;
}
