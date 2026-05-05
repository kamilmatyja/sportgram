<?php

namespace App\Dto;

use App\Enum\EntryTypeEnum;
use Symfony\Component\Uid\Uuid;

readonly class EntryCountDto
{
    public function __construct(
        public Uuid $entityId,
        public EntryTypeEnum $type,
        public int $count,
    ) {
    }
}
