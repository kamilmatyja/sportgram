<?php

namespace App\Trait;

trait EnumValuesTrait
{
    public static function values(): array
    {
        return array_map(fn (self $e) => $e->value, self::cases());
    }
}
