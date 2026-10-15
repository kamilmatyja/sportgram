<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventListDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class EventListDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EventListDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new EventListDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'EVENT_LIST_RESULTS' => [[EventListDetailsQueryDto::EVENT_LIST_RESULTS]];
        yield 'EVENT_LIST_SUB_RESULTS' => [[EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS]];
        yield 'all' => [[EventListDetailsQueryDto::EVENT_LIST_RESULTS, EventListDetailsQueryDto::EVENT_LIST_SUB_RESULTS]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new EventListDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'valid mixed with unknown' => [[EventListDetailsQueryDto::EVENT_LIST_RESULTS, 'unknown']];
        yield 'empty string' => [['']];
    }
}
