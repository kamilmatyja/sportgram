<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum EventDisciplineListStatusEnum: int
{
    use EnumValuesTrait;

    case Active = 1;
    case Rejected = 2;
}
