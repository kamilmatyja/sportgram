<?php

namespace App\Service;

use App\Dto\{StatisticIndexDto};
use App\Repository\StatisticRepository;
use DateMalformedStringException;
use Doctrine\DBAL\Exception;

readonly class StatisticService
{
    public function __construct(
        private StatisticRepository $statisticRepository,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     * @throws Exception
     */
    final public function getRecords(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->getRecords($dto);
    }

    /**
     * @throws DateMalformedStringException
     * @throws Exception
     */
    final public function getProgress(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->getProgress($dto);
    }
}
