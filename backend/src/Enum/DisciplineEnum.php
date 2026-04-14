<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum DisciplineEnum: int
{
    use EnumValuesTrait;

    case Running = 1;
    case Cycling = 2;
    case InlineSkating = 3;
    case IceSkating = 4;
    case Swimming = 5;
    case Rowing = 6;
    case Canoeing = 7;
    case CrossCountrySkiing = 8;
    case Snowboarding = 9;
    case Skateboarding = 10;
}
