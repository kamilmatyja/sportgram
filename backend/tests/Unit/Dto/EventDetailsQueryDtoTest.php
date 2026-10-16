<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class EventDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EventDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'EVENT_DISCIPLINES' => [[EventDetailsQueryDto::EVENT_DISCIPLINES]];
        yield 'EVENT_DISCIPLINE_DISTANCES' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES]];
        yield 'EVENT_DISCIPLINE_SUB_DISTANCES' => [[EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES]];
        yield 'all' => [[EventDetailsQueryDto::EVENT_DISCIPLINES, EventDetailsQueryDto::EVENT_DISCIPLINE_DISTANCES, EventDetailsQueryDto::EVENT_DISCIPLINE_SUB_DISTANCES]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new EventDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'unknown mixed with valid' => [[EventDetailsQueryDto::EVENT_DISCIPLINES, 'unknown']];
        yield 'wrong case' => [[strtoupper(EventDetailsQueryDto::EVENT_DISCIPLINES)]];
    }
}
