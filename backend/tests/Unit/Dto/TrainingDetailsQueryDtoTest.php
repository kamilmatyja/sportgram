<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\TrainingDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class TrainingDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new TrainingDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'TRAINING_DISCIPLINES' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINES]];
        yield 'TRAINING_DISCIPLINE_DISTANCES' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES]];
        yield 'TRAINING_DISCIPLINE_SUB_DISTANCES' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINE_SUB_DISTANCES]];
        yield 'TRAINING_PARTICIPANTS' => [[TrainingDetailsQueryDto::TRAINING_PARTICIPANTS]];
        yield 'all' => [[
            TrainingDetailsQueryDto::TRAINING_DISCIPLINES,
            TrainingDetailsQueryDto::TRAINING_DISCIPLINE_DISTANCES,
            TrainingDetailsQueryDto::TRAINING_DISCIPLINE_SUB_DISTANCES,
            TrainingDetailsQueryDto::TRAINING_PARTICIPANTS,
        ]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new TrainingDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'valid mixed with unknown' => [[TrainingDetailsQueryDto::TRAINING_DISCIPLINES, 'unknown']];
        yield 'empty string' => [['']];
    }
}
