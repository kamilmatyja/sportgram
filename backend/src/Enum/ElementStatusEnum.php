<?php

namespace App\Enum;

enum ElementStatusEnum: int
{
    case Draft = 1;
    case Active = 2;
    case Rejected = 3;
}
