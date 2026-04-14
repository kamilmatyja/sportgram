<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum ConversationStatusEnum: int
{
    use EnumValuesTrait;

    case Sent = 1;
    case Read = 2;
}
