<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{TrainingDisciplineDistanceDto, TrainingDisciplineDto, TrainingDisciplineSubDistanceDto};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class TrainingDisciplineDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresDiscipline(): void
    {
        $dto = new TrainingDisciplineDto();

        $this->assertSame([], $dto->distances);
        $this->assertOnlyViolation($dto, 'discipline');
    }

    #[DataProvider('disciplineProvider')]
    final public function testAcceptsDiscipline(DisciplineEnum $discipline): void
    {
        $dto = new TrainingDisciplineDto();
        $dto->discipline = $discipline;

        $this->assertValid($dto);
    }

    public static function disciplineProvider(): iterable
    {
        foreach (DisciplineEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testAddDistanceAppendsItems(): void
    {
        $first = $this->distance(5000, 1500);
        $second = $this->distance(10000, 3200);
        $dto = $this->validDto();

        $dto->addDistance($first);
        $dto->addDistance($second);

        $this->assertSame([$first, $second], $dto->distances);
        $this->assertValid($dto);
    }

    final public function testValidatesNestedDistances(): void
    {
        $dto = $this->validDto();
        $dto->addDistance($this->distance(5000, 1500));
        $dto->addDistance(new TrainingDisciplineDistanceDto());

        $this->assertViolations($dto, ['distances[1].distance', 'distances[1].time']);
    }

    final public function testValidatesDeeplyNestedSubDistances(): void
    {
        $distance = $this->distance(5000, 1500);
        $distance->addSubDistance(new TrainingDisciplineSubDistanceDto());
        $dto = $this->validDto();
        $dto->addDistance($distance);

        $this->assertViolations($dto, [
            'distances[0].subDistances[0].subDistance',
            'distances[0].subDistances[0].time',
        ]);
    }

    private function validDto(): TrainingDisciplineDto
    {
        $dto = new TrainingDisciplineDto();
        $dto->discipline = DisciplineEnum::Running;

        return $dto;
    }

    private function distance(int $distance, int $time): TrainingDisciplineDistanceDto
    {
        $dto = new TrainingDisciplineDistanceDto();
        $dto->distance = $distance;
        $dto->time = $time;

        return $dto;
    }
}
