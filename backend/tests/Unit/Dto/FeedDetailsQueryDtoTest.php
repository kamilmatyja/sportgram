<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FeedDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class FeedDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new FeedDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new FeedDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'FEED_COMMENTS' => [[FeedDetailsQueryDto::FEED_COMMENTS]];
        yield 'FEED_REACTIONS' => [[FeedDetailsQueryDto::FEED_REACTIONS]];
        yield 'FEED_ORIGIN' => [[FeedDetailsQueryDto::FEED_ORIGIN]];
        yield 'all' => [[FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::FEED_REACTIONS, FeedDetailsQueryDto::FEED_ORIGIN]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new FeedDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'unknown mixed with valid' => [[FeedDetailsQueryDto::FEED_COMMENTS, 'unknown']];
        yield 'wrong case' => [[strtoupper(FeedDetailsQueryDto::FEED_COMMENTS)]];
    }
}
