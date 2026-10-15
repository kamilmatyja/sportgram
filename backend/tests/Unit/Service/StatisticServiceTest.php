<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\StatisticIndexDto;
use App\Repository\StatisticRepository;
use App\Service\StatisticService;
use Doctrine\DBAL\{ConnectionException, Exception as DbalException};
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;

#[AllowMockObjectsWithoutExpectations]
class StatisticServiceTest extends ServiceTestCase
{
    private StatisticRepository&MockObject $statisticRepository;

    private StatisticService $service;

    protected function setUp(): void
    {
        $this->statisticRepository = $this->createMock(StatisticRepository::class);

        $this->service = new StatisticService($this->statisticRepository);
    }

    final public function testIndexRecordsDelegatesToRepository(): void
    {
        $dto = new StatisticIndexDto();
        $window = self::window([['time' => 100], ['time' => 200]]);
        $this->statisticRepository->expects($this->once())->method('findRecords')->with($dto)->willReturn($window);
        $this->statisticRepository->expects($this->never())->method('findProgress');

        $this->assertSame($window, $this->service->indexRecords($dto));
    }

    final public function testIndexRecordsReturnsEmptyWindow(): void
    {
        $dto = new StatisticIndexDto();
        $window = self::window([]);
        $this->statisticRepository->expects($this->once())->method('findRecords')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->indexRecords($dto));
    }

    final public function testIndexRecordsPropagatesRepositoryException(): void
    {
        $this->statisticRepository->expects($this->once())
            ->method('findRecords')
            ->willThrowException(new ConnectionException('boom'));

        $this->expectException(DbalException::class);
        $this->expectExceptionMessage('boom');

        $this->service->indexRecords(new StatisticIndexDto());
    }

    final public function testIndexProgressDelegatesToRepository(): void
    {
        $dto = new StatisticIndexDto();
        $window = self::window([['time' => 100]]);
        $this->statisticRepository->expects($this->once())->method('findProgress')->with($dto)->willReturn($window);
        $this->statisticRepository->expects($this->never())->method('findRecords');

        $this->assertSame($window, $this->service->indexProgress($dto));
    }

    final public function testIndexProgressPropagatesRepositoryException(): void
    {
        $this->statisticRepository->expects($this->once())
            ->method('findProgress')
            ->willThrowException(new ConnectionException('boom'));

        $this->expectException(DbalException::class);
        $this->expectExceptionMessage('boom');

        $this->service->indexProgress(new StatisticIndexDto());
    }
}
