<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\GoalDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class GoalDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new GoalDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'GOAL_PARTICIPANTS' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS]];
        yield 'GOAL_PARTICIPANT_RESULTS' => [[GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS]];
        yield 'both' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS, GoalDetailsQueryDto::GOAL_PARTICIPANT_RESULTS]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new GoalDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'known mixed with unknown' => [[GoalDetailsQueryDto::GOAL_PARTICIPANTS, 'unknown']];
        yield 'different case' => [[ucfirst(GoalDetailsQueryDto::GOAL_PARTICIPANTS)]];
    }
}
