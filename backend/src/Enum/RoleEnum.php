<?php

namespace App\Enum;

enum RoleEnum: int
{
    public const string ROLE_PARTICIPANT = 'ROLE_PARTICIPANT';

    public const string ROLE_ORGANIZER = 'ROLE_ORGANIZER';

    public const string ROLE_ADMINISTRATOR = 'ROLE_ADMINISTRATOR';

    case Participant = 1;
    case Organizer = 2;
    case Administrator = 3;

    public function getLabel(): string
    {
        return match ($this) {
            self::Participant => self::ROLE_PARTICIPANT,
            self::Organizer => self::ROLE_ORGANIZER,
            self::Administrator => self::ROLE_ADMINISTRATOR,
        };
    }

    /** @return self[] */
    public static function nano(): array
    {
        return [self::Participant, self::Organizer];
    }
}
