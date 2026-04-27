<?php

namespace App\Service;

use App\Dto\{StatisticIndexDto};
use App\Repository\StatisticRepository;

readonly class StatisticService
{
    public function __construct(
        private StatisticRepository $statisticRepository,
    ) {
    }

    final public function getRecords(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->getRecords($dto);
    }

    final public function getProgress(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->getProgress($dto);
    }
}
