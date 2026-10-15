<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EventDisciplineDistanceDto, EventDisciplineSubDistanceDto};

class EventDisciplineDistanceDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $this->assertSame([], new EventDisciplineDistanceDto()->subDistances);
    }

    final public function testEmptyDtoRequiresDistance(): void
    {
        $this->assertViolations(new EventDisciplineDistanceDto(), ['distance']);
    }

    final public function testValidDtoWithoutSubDistances(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testAddSubDistanceAppendsInOrder(): void
    {
        $first = $this->subDistance(50);
        $second = $this->subDistance(100);
        $dto = $this->validDto();

        $dto->addSubDistance($first);
        $dto->addSubDistance($second);

        $this->assertSame([$first, $second], $dto->subDistances);
        $this->assertValid($dto);
    }

    final public function testCascadesValidationToSubDistances(): void
    {
        $dto = $this->validDto();
        $dto->addSubDistance($this->subDistance(50));
        $dto->addSubDistance(new EventDisciplineSubDistanceDto());

        $this->assertOnlyViolation($dto, 'subDistances[1].subDistance');
    }

    private function validDto(): EventDisciplineDistanceDto
    {
        $dto = new EventDisciplineDistanceDto();
        $dto->distance = 100;

        return $dto;
    }

    private function subDistance(int $value): EventDisciplineSubDistanceDto
    {
        $subDistance = new EventDisciplineSubDistanceDto();
        $subDistance->subDistance = $value;

        return $subDistance;
    }
}
