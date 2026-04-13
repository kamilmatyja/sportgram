<?php

namespace App\Enum;

enum UnauthorizedStatusEnum: int
{
    case NotSent = 1;
    case Sent = 2;
    case Correct = 3;
    case Incorrect = 4;
}
