<?php

namespace App\Enum;

enum RoleEnum: int
{
    case Participant = 1;
    case Organizer = 2;
    case Administrator = 3;
}
