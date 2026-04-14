<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum RoleEnum: int
{
    use EnumValuesTrait;

    case Participant = 1;
    case Organizer = 2;
    case Administrator = 3;
}
