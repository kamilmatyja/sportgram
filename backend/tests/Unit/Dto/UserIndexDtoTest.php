<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{UserFilterDto, UserIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class UserIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new UserIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(UserFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new UserIndexDto()->filter, new UserIndexDto()->filter);
    }

    final public function testValidatesNestedFilter(): void
    {
        $dto = new UserIndexDto();
        $dto->filter->email = 'not-an-email';

        $this->assertOnlyViolation($dto, 'filter.email');
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new UserIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new UserIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['firstName', 'lastName', 'gender', 'country', 'birthAt', 'status', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new UserIndexDto();
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
        yield 'sort without direction' => ['sort', 'firstName'];
        yield 'sort with invalid direction' => ['sort', 'firstName:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new UserFilterDto();
        $dto = new UserIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
