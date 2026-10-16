<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{PageFollowFilterDto, PageFollowIndexDto};
use App\Enum\PageFollowStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class PageFollowIndexDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PageFollowIndexDto();

        $this->assertSame(1, $dto->page);
        $this->assertSame(10, $dto->limit);
        $this->assertSame('createdAt:desc', $dto->sort);
        $this->assertInstanceOf(PageFollowFilterDto::class, $dto->filter);
        $this->assertSame([], $dto->filter->pageIds);
        $this->assertNull($dto->filter->status);
    }

    final public function testDefaultFilterRequiresUserId(): void
    {
        $this->assertViolations(new PageFollowIndexDto(), ['filter.userId']);
    }

    final public function testEachInstanceHasOwnFilter(): void
    {
        $this->assertNotSame(new PageFollowIndexDto()->filter, new PageFollowIndexDto()->filter);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = $this->validDto();
        $dto->page = 1000;
        $dto->limit = 100;

        $this->assertValid($dto);
    }

    #[DataProvider('validSortProvider')]
    final public function testAcceptsSort(string $sort): void
    {
        $dto = $this->validDto();
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
        $dto = $this->validDto();
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
        yield 'sort without direction' => ['sort', 'status'];
    }

    final public function testValidFilterWithPageIdsAndStatus(): void
    {
        $dto = $this->validDto();
        $dto->filter->addPageId(Uuid::v4());
        $dto->filter->addPageId(Uuid::v4());
        $dto->filter->status = PageFollowStatusEnum::Accepted;

        $this->assertCount(2, $dto->filter->pageIds);
        $this->assertValid($dto);
    }

    final public function testRejectsDuplicatedPageIdInFilter(): void
    {
        $pageId = Uuid::v4();
        $dto = $this->validDto();
        $dto->filter->addPageId($pageId);
        $dto->filter->addPageId($pageId);

        $this->assertOnlyViolation($dto, 'filter.pageIds');
    }

    private function validDto(): PageFollowIndexDto
    {
        $dto = new PageFollowIndexDto();
        $dto->filter->userId = Uuid::v4();

        return $dto;
    }
}
