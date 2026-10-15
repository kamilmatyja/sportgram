<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{TrainingFilterDto, TrainingIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class TrainingIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new TrainingIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(TrainingFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new TrainingIndexDto()->filter, new TrainingIndexDto()->filter);
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new TrainingIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new TrainingIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['title', 'location', 'status', 'createdAt', 'startedAt', 'endedAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new TrainingIndexDto();
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
        yield 'unknown sort' => ['sort', 'link:asc'];
        yield 'sort without direction' => ['sort', 'title'];
        yield 'sort with unknown direction' => ['sort', 'title:up'];
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new TrainingIndexDto();
        $dto->filter->title = str_repeat('a', 2049);

        $this->assertOnlyViolation($dto, 'filter.title');
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new TrainingFilterDto();
        $dto = new TrainingIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
