<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{StatisticFilterDto, StatisticIndexDto};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class StatisticIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new StatisticIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(StatisticFilterDto::class, $dto->filter);
        $this->assertSame([], $dto->filter->userIds);
    }

    final public function testDefaultFilterRequiresUserIds(): void
    {
        $this->assertViolations(new StatisticIndexDto(), ['filter.userIds']);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new StatisticIndexDto()->filter, new StatisticIndexDto()->filter);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = $this->validDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = $this->validDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['discipline', 'distance', 'time', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'page zero' => ['page', 0];
        yield 'page negative' => ['page', -1];
        yield 'page too big' => ['page', 1001];
        yield 'limit zero' => ['limit', 0];
        yield 'limit too big' => ['limit', 101];
        yield 'unknown sort' => ['sort', 'status:asc'];
        yield 'sort without direction' => ['sort', 'time'];
    }

    final public function testValidFilterWithAllFields(): void
    {
        $dto = $this->validDto();
        $dto->filter->addUserId(Uuid::v4());
        $dto->filter->discipline = DisciplineEnum::Running;
        $dto->filter->distance = 1;

        $this->assertCount(2, $dto->filter->userIds);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidDistanceProvider')]
    final public function testRejectsNonPositiveDistanceInFilter(int $distance): void
    {
        $dto = $this->validDto();
        $dto->filter->distance = $distance;

        $this->assertOnlyViolation($dto, 'filter.distance');
    }

    public static function invalidDistanceProvider(): iterable
    {
        yield 'zero' => [0];
        yield 'negative' => [-5];
    }

    final public function testRejectsDuplicatedUserIdInFilter(): void
    {
        $dto = $this->validDto();
        $dto->filter->addUserId($dto->filter->userIds[0]);

        $this->assertOnlyViolation($dto, 'filter.userIds');
    }

    private function validDto(): StatisticIndexDto
    {
        $dto = new StatisticIndexDto();
        $dto->filter->addUserId(Uuid::v4());

        return $dto;
    }
}
