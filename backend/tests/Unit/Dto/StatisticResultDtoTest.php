<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\StatisticResultDto;
use DateTimeImmutable;
use Error;
use Symfony\Component\Uid\Uuid;

class StatisticResultDtoTest extends DtoTestCase
{
    final public function testStoresValues(): void
    {
        $userId = Uuid::v7();
        $createdAt = new DateTimeImmutable('2000-01-01 10:00');
        $dto = new StatisticResultDto($userId, $createdAt, 1, 5000, 1800);

        $this->assertSame($userId, $dto->userId);
        $this->assertSame($createdAt, $dto->createdAt);
        $this->assertSame(1, $dto->discipline);
        $this->assertSame(5000, $dto->distance);
        $this->assertSame(1800, $dto->time);
    }

    final public function testIsReadonly(): void
    {
        $dto = new StatisticResultDto(Uuid::v7(), new DateTimeImmutable(), 1, 5000, 1800);

        $this->expectException(Error::class);

        $dto->time = 1;
    }
}
