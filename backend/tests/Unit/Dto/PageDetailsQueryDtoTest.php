<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PageDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class PageDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PageDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new PageDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'PAGE_PARTICIPANTS' => [[PageDetailsQueryDto::PAGE_PARTICIPANTS]];
        yield 'PAGE_FOLLOWS' => [[PageDetailsQueryDto::PAGE_FOLLOWS]];
        yield 'both' => [[PageDetailsQueryDto::PAGE_PARTICIPANTS, PageDetailsQueryDto::PAGE_FOLLOWS]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new PageDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'known mixed with unknown' => [[PageDetailsQueryDto::PAGE_PARTICIPANTS, 'unknown']];
        yield 'different case' => [[ucfirst(PageDetailsQueryDto::PAGE_PARTICIPANTS)]];
    }
}
