<?php

namespace App\Service;

use App\Dto\{StatisticIndexDto};
use App\Repository\StatisticRepository;
use DateMalformedStringException;
use Doctrine\DBAL\Exception;
use Doctrine\ORM\Tools\Pagination\WindowPage;

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
    final public function indexRecords(StatisticIndexDto $dto): WindowPage
    {
        return $this->statisticRepository->findRecords($dto);
    }

    /**
     * @throws DateMalformedStringException
     * @throws Exception
     */
    final public function indexProgress(StatisticIndexDto $dto): WindowPage
    {
        return $this->statisticRepository->findProgress($dto);
    }
}
