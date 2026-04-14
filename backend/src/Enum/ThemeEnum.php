<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum ThemeEnum: int
{
    use EnumValuesTrait;

    case Dark = 1;
    case Light = 2;
}
