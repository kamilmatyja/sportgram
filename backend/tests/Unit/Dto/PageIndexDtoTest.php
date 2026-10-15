<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{PageFilterDto, PageIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class PageIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PageIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(PageFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new PageIndexDto()->filter, new PageIndexDto()->filter);
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new PageIndexDto();
        $dto->filter->link = '';

        $this->assertOnlyViolation($dto, 'filter.link');
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new PageIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new PageIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['title', 'status', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new PageIndexDto();
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
        yield 'unknown sort' => ['sort', 'unknown:asc'];
        yield 'sort without direction' => ['sort', 'title'];
        yield 'sort with invalid direction' => ['sort', 'title:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new PageFilterDto();
        $dto = new PageIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
