<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum LanguageEnum: int
{
    use EnumValuesTrait;

    case English = 1;
    case Polish = 2;
}
