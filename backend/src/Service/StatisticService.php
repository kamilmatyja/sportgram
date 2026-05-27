<?php

namespace App\Service;

use App\Dto\{StatisticIndexDto, StatisticResultDto};
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
     * @return StatisticResultDto[]
     * @throws DateMalformedStringException
     * @throws Exception
     */
    final public function indexRecords(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->findRecords($dto);
    }

    /**
     * @return StatisticResultDto[]
     * @throws DateMalformedStringException
     * @throws Exception
     */
    final public function indexProgress(StatisticIndexDto $dto): array
    {
        return $this->statisticRepository->findProgress($dto);
    }
}
