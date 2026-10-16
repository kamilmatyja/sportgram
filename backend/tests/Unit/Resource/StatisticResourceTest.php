<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\StatisticResultDto;
use App\Resource\StatisticResource;
use DateTimeImmutable;
use Symfony\Component\Uid\Uuid;

class StatisticResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $result = new StatisticResultDto(Uuid::v4(), new DateTimeImmutable('2026-04-22 10:15:30.123456'), 2, 5000, 1800);

        $data = StatisticResource::fromEntity($result);

        $this->assertSame([
            'userId' => $result->userId,
            'createdAt' => '2026-04-22T10:15:30',
            'discipline' => 2,
            'distance' => 5000,
            'time' => 1800,
        ], $data);
        $this->assertMatchesSchema(StatisticResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $results = [
            new StatisticResultDto(Uuid::v4(), new DateTimeImmutable('2026-01-01'), 1, 100, 60),
            new StatisticResultDto(Uuid::v4(), new DateTimeImmutable('2026-01-02'), 3, 0, 0),
        ];

        $data = StatisticResource::fromEntityCollection($results);

        $this->assertSame(
            [StatisticResource::fromEntity($results[0]), StatisticResource::fromEntity($results[1])],
            $data,
        );
        $this->assertSame([], StatisticResource::fromEntityCollection([]));
    }
}
