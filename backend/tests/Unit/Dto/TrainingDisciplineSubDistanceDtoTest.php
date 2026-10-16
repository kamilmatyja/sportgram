<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\TrainingDisciplineSubDistanceDto;

class TrainingDisciplineSubDistanceDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new TrainingDisciplineSubDistanceDto();

        $this->assertNull($dto->lat);
        $this->assertNull($dto->lng);
        $this->assertNull($dto->accuracy);
        $this->assertNull($dto->speed);
    }

    final public function testEmptyDtoRequiresSubDistanceAndTime(): void
    {
        $this->assertViolations(new TrainingDisciplineSubDistanceDto(), ['subDistance', 'time']);
    }

    final public function testValidDtoWithRequiredFieldsOnly(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testValidDtoWithAllFields(): void
    {
        $dto = $this->validDto();
        $dto->lat = 52;
        $dto->lng = -21;
        $dto->accuracy = 5;
        $dto->speed = 12;

        $this->assertValid($dto);
    }

    private function validDto(): TrainingDisciplineSubDistanceDto
    {
        $dto = new TrainingDisciplineSubDistanceDto();
        $dto->subDistance = 100;
        $dto->time = 60;

        return $dto;
    }
}
