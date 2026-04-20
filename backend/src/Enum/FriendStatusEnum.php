<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum FriendStatusEnum: int
{
    use EnumValuesTrait;

    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
    case Blocked = 4;

    public static function allowed(): array
    {
        return [self::Accepted->value, self::Rejected->value, self::Blocked->value];
    }
}
