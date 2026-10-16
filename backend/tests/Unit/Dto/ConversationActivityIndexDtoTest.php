<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{ConversationActivityFilterDto, ConversationActivityIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;

class ConversationActivityIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new ConversationActivityIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('updatedAt:desc', $dto->sort);
        $this->assertInstanceOf(ConversationActivityFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new ConversationActivityIndexDto()->filter, new ConversationActivityIndexDto()->filter);
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new ConversationActivityIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new ConversationActivityIndexDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['createdAt', 'updatedAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new ConversationActivityIndexDto();
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
        yield 'sort without direction' => ['sort', 'createdAt'];
        yield 'sort with unknown direction' => ['sort', 'createdAt:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new ConversationActivityFilterDto();
        $dto = new ConversationActivityIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }
}
