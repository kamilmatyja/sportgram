<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PageFollowFilterDto;
use App\Enum\PageFollowStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class PageFollowFilterDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresUserId(): void
    {
        $dto = new PageFollowFilterDto();

        $this->assertSame([], $dto->pageIds);
        $this->assertNull($dto->status);
        $this->assertOnlyViolation($dto, 'userId');
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(PageFollowStatusEnum $status): void
    {
        $dto = $this->validDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (PageFollowStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testAddPageIdAppendsItems(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = $this->validDto();

        $dto->addPageId($first);
        $dto->addPageId($second);

        $this->assertSame([$first, $second], $dto->pageIds);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidPageIdProvider')]
    final public function testRejectsInvalidPageId(mixed $pageId): void
    {
        $dto = $this->validDto();
        $dto->pageIds = [Uuid::v7(), $pageId];

        $this->assertOnlyViolation($dto, 'pageIds[1]');
    }

    public static function invalidPageIdProvider(): iterable
    {
        yield 'empty string' => [''];
        yield 'null' => [null];
        yield 'not a uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedPageId(): void
    {
        $pageId = Uuid::v7();
        $dto = $this->validDto();
        $dto->addPageId($pageId);
        $dto->addPageId($pageId);

        $this->assertOnlyViolation($dto, 'pageIds');
    }

    private function validDto(): PageFollowFilterDto
    {
        $dto = new PageFollowFilterDto();
        $dto->userId = Uuid::v7();

        return $dto;
    }
}
