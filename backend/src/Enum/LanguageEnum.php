<?php

namespace App\Enum;

enum LanguageEnum: int
{
    case English = 1;
    case Polish = 2;

    public function getLocale(): string
    {
        return match ($this) {
            self::English => 'en',
            self::Polish => 'pl',
        };
    }
}
