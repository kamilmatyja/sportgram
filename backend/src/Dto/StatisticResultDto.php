<?php

namespace App\Dto;

use DateTimeImmutable;
use Symfony\Component\Uid\Uuid;

readonly class StatisticResultDto
{
    public function __construct(
        public Uuid $userId,
        public DateTimeImmutable $createdAt,
        public int $discipline,
        public int $distance,
        public int $time,
    ) {
    }
}
