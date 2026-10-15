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
        yield 'EVENT_DISCIPLINE_LIST' => [[FeedDetailsQueryDto::EVENT_DISCIPLINE_LIST]];
        yield 'EVENT_DISCIPLINE_RESULT' => [[FeedDetailsQueryDto::EVENT_DISCIPLINE_RESULT]];
        yield 'GOAL' => [[FeedDetailsQueryDto::GOAL]];
        yield 'GOAL_PARTICIPANT_RESULT' => [[FeedDetailsQueryDto::GOAL_PARTICIPANT_RESULT]];
        yield 'TRAINING' => [[FeedDetailsQueryDto::TRAINING]];
        yield 'all' => [[FeedDetailsQueryDto::FEED_COMMENTS, FeedDetailsQueryDto::FEED_REACTIONS, FeedDetailsQueryDto::EVENT_DISCIPLINE_LIST, FeedDetailsQueryDto::EVENT_DISCIPLINE_RESULT, FeedDetailsQueryDto::GOAL, FeedDetailsQueryDto::GOAL_PARTICIPANT_RESULT, FeedDetailsQueryDto::TRAINING]];
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
