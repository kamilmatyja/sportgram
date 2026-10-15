<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EventDisciplineDistanceDto, EventDisciplineDto, EventDisciplineSubDistanceDto};
use App\Enum\DisciplineEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class EventDisciplineDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $this->assertSame([], new EventDisciplineDto()->distances);
    }

    final public function testRequiresDiscipline(): void
    {
        $this->assertViolations(new EventDisciplineDto(), ['discipline']);
    }

    #[DataProvider('disciplineProvider')]
    final public function testAcceptsDiscipline(DisciplineEnum $discipline): void
    {
        $dto = new EventDisciplineDto();
        $dto->discipline = $discipline;

        $this->assertValid($dto);
    }

    public static function disciplineProvider(): iterable
    {
        foreach (DisciplineEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testAddDistanceAppends(): void
    {
        $first = new EventDisciplineDistanceDto();
        $second = new EventDisciplineDistanceDto();
        $dto = new EventDisciplineDto();
        $dto->addDistance($first);
        $dto->addDistance($second);

        $this->assertSame([$first, $second], $dto->distances);
    }

    final public function testValidWithNestedDistances(): void
    {
        $subDistance = new EventDisciplineSubDistanceDto();
        $subDistance->subDistance = 500;
        $distance = new EventDisciplineDistanceDto();
        $distance->distance = 1000;
        $distance->addSubDistance($subDistance);
        $dto = new EventDisciplineDto();
        $dto->discipline = DisciplineEnum::Running;
        $dto->addDistance($distance);

        $this->assertValid($dto);
    }

    final public function testValidatesNestedDistance(): void
    {
        $valid = new EventDisciplineDistanceDto();
        $valid->distance = 1000;
        $dto = new EventDisciplineDto();
        $dto->discipline = DisciplineEnum::Running;
        $dto->addDistance($valid);
        $dto->addDistance(new EventDisciplineDistanceDto());

        $this->assertOnlyViolation($dto, 'distances[1].distance');
    }

    final public function testValidatesNestedSubDistance(): void
    {
        $distance = new EventDisciplineDistanceDto();
        $distance->distance = 1000;
        $distance->addSubDistance(new EventDisciplineSubDistanceDto());
        $dto = new EventDisciplineDto();
        $dto->discipline = DisciplineEnum::Running;
        $dto->addDistance($distance);

        $this->assertOnlyViolation($dto, 'distances[0].subDistances[0].subDistance');
    }
}
