<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EntryCountFilterDto, EntryCountIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class EntryCountIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EntryCountIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('count:desc', $dto->sort);
        $this->assertInstanceOf(EntryCountFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new EntryCountIndexDto()->filter, new EntryCountIndexDto()->filter);
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new EntryCountIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new EntryCountIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['type', 'count'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new EntryCountIndexDto();
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
        yield 'unknown sort' => ['sort', 'title:asc'];
        yield 'sort without direction' => ['sort', 'type'];
        yield 'sort with unknown direction' => ['sort', 'type:up'];
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new EntryCountIndexDto();
        $dto->filter->entityIds = ['not-a-uuid'];

        $this->assertOnlyViolation($dto, 'filter.entityIds[0]');
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new EntryCountFilterDto();
        $dto = new EntryCountIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
