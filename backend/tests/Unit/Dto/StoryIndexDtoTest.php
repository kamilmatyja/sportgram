<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{StoryFilterDto, StoryIndexDto};
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class StoryIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new StoryIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(StoryFilterDto::class, $dto->filter);
        $this->assertValid($dto);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new StoryIndexDto()->filter, new StoryIndexDto()->filter);
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = new StoryIndexDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = new StoryIndexDto();
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
        $dto = new StoryIndexDto();
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
        yield 'sort without direction' => ['sort', 'text'];
    }

    final public function testValidFilterWithAllFields(): void
    {
        $dto = new StoryIndexDto();
        $dto->filter->userId = Uuid::v7();
        $dto->filter->text = str_repeat('a', 2048);
        $dto->filter->status = ElementStatusEnum::Rejected;

        $this->assertValid($dto);
    }

    #[DataProvider('invalidFilterTextProvider')]
    final public function testValidatesNestedFilter(string $text): void
    {
        $dto = new StoryIndexDto();
        $dto->filter->text = $text;

        $this->assertOnlyViolation($dto, 'filter.text');
    }

    public static function invalidFilterTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }
}
