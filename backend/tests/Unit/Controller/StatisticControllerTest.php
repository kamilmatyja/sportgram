<?php

declare(strict_types=1);

namespace Tests\Unit\Controller;

use App\Controller\StatisticController;
use App\Dto\{StatisticIndexDto, StatisticResultDto};
use App\Resource\StatisticResource;
use App\Service\StatisticService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Uid\Uuid;

class StatisticControllerTest extends ControllerTestCase
{
    private StatisticService&MockObject $service;

    private StatisticController $controller;

    protected function setUp(): void
    {
        $this->controller = new StatisticController();
    }

    #[DataProvider('routeProvider')]
    final public function testRouting(string $action, string $path, string $method, string $name, string $attribute, ?string $subject): void
    {
        $this->assertRoute([StatisticController::class, $action], $path, [$method], $name);
        $this->assertGrantedBy([StatisticController::class, $action], $attribute, $subject);
    }

    public static function routeProvider(): iterable
    {
        yield 'indexRecords' => ['indexRecords', '/api/statistics/records', 'GET', 'statistic_record_index', 'IS_AUTHENTICATED_FULLY', null];
        yield 'indexProgress' => ['indexProgress', '/api/statistics/progress', 'GET', 'statistic_progres_index', 'IS_AUTHENTICATED_FULLY', null];
    }

    final public function testRoutesAreAllCovered(): void
    {
        $this->assertCoversAllRoutes(StatisticController::class, array_keys(iterator_to_array(self::routeProvider())));
    }

    final public function testRequestMapping(): void
    {
        $this->assertMapsQueryString([StatisticController::class, 'indexRecords'], 'dto');
        $this->assertMapsQueryString([StatisticController::class, 'indexProgress'], 'dto');
    }

    final public function testIndexRecords(): void
    {
        $dto = new StatisticIndexDto();
        $results = [self::statisticResult(), self::statisticResult()];
        $window = self::window($results, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('indexRecords')->with($dto)->willReturn($window);
        $this->service()->expects($this->never())->method('indexProgress');

        $response = $this->controller->indexRecords($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => StatisticResource::fromEntityCollection($results),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexRecordsWithoutResults(): void
    {
        $dto = new StatisticIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexRecords')->with($dto)->willReturn($window);

        $response = $this->controller->indexRecords($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    final public function testIndexProgress(): void
    {
        $dto = new StatisticIndexDto();
        $results = [self::statisticResult(), self::statisticResult()];
        $window = self::window($results, total: 12, page: 1, limit: 2);
        $this->service()->expects($this->once())->method('indexProgress')->with($dto)->willReturn($window);
        $this->service()->expects($this->never())->method('indexRecords');

        $response = $this->controller->indexProgress($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, [
            'data' => StatisticResource::fromEntityCollection($results),
            'pagination' => self::pagination($window),
        ], $response);
    }

    final public function testIndexProgressWithoutResults(): void
    {
        $dto = new StatisticIndexDto();
        $window = self::window([]);
        $this->service()->expects($this->once())->method('indexProgress')->with($dto)->willReturn($window);

        $response = $this->controller->indexProgress($dto, $this->service());

        $this->assertJsonResponse(Response::HTTP_OK, ['data' => [], 'pagination' => self::pagination($window)], $response);
    }

    private function service(): StatisticService&MockObject
    {
        return $this->service ??= $this->createMock(StatisticService::class);
    }

    private static function statisticResult(): StatisticResultDto
    {
        return new StatisticResultDto(Uuid::v4(), new DateTimeImmutable('2025-06-01 10:00:00'), 1, 5000, 1800);
    }
}
