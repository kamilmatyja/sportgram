<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum ElementStatusEnum: int
{
    use EnumValuesTrait;

    case Draft = 1;
    case Active = 2;
    case Rejected = 3;

    public static function allowed(): array
    {
        return [self::Draft->value, self::Active->value];
    }
}
