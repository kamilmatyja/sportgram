<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{FeedFilterDto, FeedIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class FeedIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new FeedIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(FeedFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new FeedIndexDto()->filter, new FeedIndexDto()->filter);
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new FeedIndexDto();
        $dto->filter->text = '';

        $this->assertOnlyViolation($dto, 'filter.text');
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new FeedIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new FeedIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['text', 'status', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new FeedIndexDto();
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
        yield 'sort without direction' => ['sort', 'text'];
        yield 'sort with invalid direction' => ['sort', 'text:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new FeedFilterDto();
        $dto = new FeedIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
