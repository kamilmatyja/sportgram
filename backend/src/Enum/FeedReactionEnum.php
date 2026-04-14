<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum FeedReactionEnum: int
{
    use EnumValuesTrait;

    case Like = 1;
    case Love = 2;
    case Haha = 3;
    case Wow = 4;
    case Sad = 5;
    case Angry = 6;
}
