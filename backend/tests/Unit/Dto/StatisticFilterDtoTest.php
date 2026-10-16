<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\StatisticFilterDto;
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class StatisticFilterDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresUserIds(): void
    {
        $dto = new StatisticFilterDto();

        $this->assertSame([], $dto->userIds);
        $this->assertNull($dto->discipline);
        $this->assertNull($dto->distance);
        $this->assertOnlyViolation($dto, 'userIds');
    }

    final public function testValidDto(): void
    {
        $dto = $this->validDto();
        $dto->discipline = DisciplineEnum::Swimming;
        $dto->distance = 1;

        $this->assertValid($dto);
    }

    final public function testAddUserIdAppendsItems(): void
    {
        $first = Uuid::v4();
        $second = Uuid::v4();
        $dto = new StatisticFilterDto();

        $dto->addUserId($first);
        $dto->addUserId($second);

        $this->assertSame([$first, $second], $dto->userIds);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = $this->validDto();
        $dto->userIds[] = $userId;

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty string' => [''];
        yield 'null' => [null];
        yield 'not a uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedUserId(): void
    {
        $userId = Uuid::v4();
        $dto = new StatisticFilterDto();
        $dto->addUserId($userId);
        $dto->addUserId($userId);

        $this->assertOnlyViolation($dto, 'userIds');
    }

    #[DataProvider('invalidDistanceProvider')]
    final public function testRejectsNonPositiveDistance(int $distance): void
    {
        $dto = $this->validDto();
        $dto->distance = $distance;

        $this->assertOnlyViolation($dto, 'distance');
    }

    public static function invalidDistanceProvider(): iterable
    {
        yield 'zero' => [0];
        yield 'negative' => [-1];
    }

    private function validDto(): StatisticFilterDto
    {
        $dto = new StatisticFilterDto();
        $dto->addUserId(Uuid::v4());

        return $dto;
    }
}
