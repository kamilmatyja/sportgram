<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum EntryTypeEnum: int
{
    use EnumValuesTrait;

    case User = 1;
    case Story = 2;
    case Conversation = 3;
    case Feed = 4;
    case Goal = 5;
    case Page = 6;
    case Event = 7;
    case Training = 8;
}
