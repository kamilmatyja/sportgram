<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum GenderEnum: int
{
    use EnumValuesTrait;

    case Male = 1;
    case Female = 2;
}
