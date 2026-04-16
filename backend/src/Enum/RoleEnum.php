<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum RoleEnum: int
{
    use EnumValuesTrait;

    case Participant = 1;
    case Organizer = 2;
    case Administrator = 3;

    public function getLabel(): string
    {
        return match ($this) {
            self::Participant => 'ROLE_PARTICIPANT',
            self::Organizer => 'ROLE_ORGANIZER',
            self::Administrator => 'ROLE_ADMINISTRATOR',
        };
    }
}
