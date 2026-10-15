<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EntryFilterDto, EntryIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class EntryIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EntryIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(EntryFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new EntryIndexDto()->filter, new EntryIndexDto()->filter);
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new EntryIndexDto();
        $dto->filter->entityIds = ['not-a-uuid'];

        $this->assertOnlyViolation($dto, 'filter.entityIds[0]');
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new EntryIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new EntryIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['type', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new EntryIndexDto();
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
        yield 'sort without direction' => ['sort', 'type'];
        yield 'sort with invalid direction' => ['sort', 'type:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new EntryFilterDto();
        $dto = new EntryIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
