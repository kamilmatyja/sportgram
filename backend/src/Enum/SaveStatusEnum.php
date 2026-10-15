<?php

namespace App\Enum;

enum SaveStatusEnum: int
{
    case Pending = 1;
    case Accepted = 2;
    case Rejected = 3;
}
