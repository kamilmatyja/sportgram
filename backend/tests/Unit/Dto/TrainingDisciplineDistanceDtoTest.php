<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{TrainingDisciplineDistanceDto, TrainingDisciplineSubDistanceDto};

class TrainingDisciplineDistanceDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new TrainingDisciplineDistanceDto();

        $this->assertNull($dto->time);
        $this->assertSame([], $dto->subDistances);
    }

    final public function testEmptyDtoRequiresDistanceAndTime(): void
    {
        $this->assertViolations(new TrainingDisciplineDistanceDto(), ['distance', 'time']);
    }

    final public function testValidDtoPasses(): void
    {
        $this->assertValid(self::validDto());
    }

    final public function testRejectsNullTime(): void
    {
        $dto = self::validDto();
        $dto->time = null;

        $this->assertOnlyViolation($dto, 'time');
    }

    final public function testZeroValuesAreNotBlank(): void
    {
        $dto = self::validDto();
        $dto->distance = 0;
        $dto->time = 0;

        $this->assertValid($dto);
    }

    final public function testAddSubDistanceAppendsItems(): void
    {
        $first = self::subDistance(100);
        $second = self::subDistance(200);
        $dto = self::validDto();
        $dto->addSubDistance($first);
        $dto->addSubDistance($second);

        $this->assertSame([$first, $second], $dto->subDistances);
        $this->assertValid($dto);
    }

    final public function testValidatesNestedSubDistances(): void
    {
        $dto = self::validDto();
        $dto->addSubDistance(self::subDistance(100));
        $dto->addSubDistance(new TrainingDisciplineSubDistanceDto());

        $this->assertViolations($dto, ['subDistances[1].subDistance', 'subDistances[1].time']);
    }

    private static function validDto(): TrainingDisciplineDistanceDto
    {
        $dto = new TrainingDisciplineDistanceDto();
        $dto->distance = 1000;
        $dto->time = 300;

        return $dto;
    }

    private static function subDistance(int $value): TrainingDisciplineSubDistanceDto
    {
        $subDistance = new TrainingDisciplineSubDistanceDto();
        $subDistance->subDistance = $value;
        $subDistance->time = 30;

        return $subDistance;
    }
}
