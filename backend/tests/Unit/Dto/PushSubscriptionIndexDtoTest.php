<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{PushSubscriptionFilterDto, PushSubscriptionIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class PushSubscriptionIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PushSubscriptionIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(PushSubscriptionFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new PushSubscriptionIndexDto()->filter, new PushSubscriptionIndexDto()->filter);
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new PushSubscriptionIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new PushSubscriptionIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['endpoint', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new PushSubscriptionIndexDto();
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
        yield 'unknown sort' => ['sort', 'auth:asc'];
        yield 'sort without direction' => ['sort', 'endpoint'];
    }

    #[DataProvider('invalidFilterProvider')]
    final public function testValidatesNestedFilter(string $property, string $value): void
    {
        $dto = new PushSubscriptionIndexDto();
        $dto->filter->{$property} = $value;

        $this->assertOnlyViolation($dto, "filter.$property");
    }

    public static function invalidFilterProvider(): iterable
    {
        yield 'endpoint empty' => ['endpoint', ''];
        yield 'endpoint too long' => ['endpoint', str_repeat('a', 2049)];
        yield 'p256dh empty' => ['p256dh', ''];
        yield 'p256dh too long' => ['p256dh', str_repeat('a', 257)];
        yield 'auth empty' => ['auth', ''];
        yield 'auth too long' => ['auth', str_repeat('a', 257)];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new PushSubscriptionFilterDto();
        $filter->endpoint = 'https://push.example.com/abc';
        $dto = new PushSubscriptionIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
