<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{ConversationFilterDto, ConversationIndexDto};
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class ConversationIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new ConversationIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(ConversationFilterDto::class, $dto->filter);
        $this->assertViolations($dto, ['filter.userId']);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new ConversationIndexDto()->filter, new ConversationIndexDto()->filter);
    }

    final public function testValidDtoPasses(): void
    {
        $this->assertValid(self::validDto());
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = self::validDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = self::validDto();
        $dto->sort = $sort;

        $this->assertValid($dto);
    }

    public static function validSortProvider(): iterable
    {
        foreach (['status', 'createdAt'] as $field) {
            yield "$field:asc" => ["$field:asc"];
            yield "$field:desc" => ["$field:desc"];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = self::validDto();
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
        yield 'sort without direction' => ['sort', 'status'];
        yield 'sort with invalid direction' => ['sort', 'status:up'];
    }

    final public function testAcceptsCustomFilter(): void
    {
        $filter = new ConversationFilterDto();
        $filter->userId = Uuid::v4();
        $dto = new ConversationIndexDto();
        $dto->filter = $filter;

        $this->assertSame($filter, $dto->filter);
        $this->assertValid($dto);
    }

    private static function validDto(): ConversationIndexDto
    {
        $dto = new ConversationIndexDto();
        $dto->filter->userId = Uuid::v4();

        return $dto;
    }
}
