<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EventResultDto, EventSubResultDto};
use Symfony\Component\Uid\Uuid;

class EventResultDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $this->assertSame([], new EventResultDto()->subResults);
    }

    final public function testEmptyDtoRequiresTime(): void
    {
        $this->assertViolations(new EventResultDto(), ['time']);
    }

    final public function testValidDtoWithoutSubResults(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testAddSubResultAppendsInOrder(): void
    {
        $first = $this->subResult(30);
        $second = $this->subResult(60);
        $dto = $this->validDto();

        $dto->addSubResult($first);
        $dto->addSubResult($second);

        $this->assertSame([$first, $second], $dto->subResults);
        $this->assertValid($dto);
    }

    final public function testCascadesValidationToSubResults(): void
    {
        $dto = $this->validDto();
        $dto->addSubResult($this->subResult(30));
        $dto->addSubResult(new EventSubResultDto());

        $this->assertViolations($dto, ['subResults[1].eventDisciplineSubDistanceId', 'subResults[1].time']);
    }

    private function validDto(): EventResultDto
    {
        $dto = new EventResultDto();
        $dto->time = 60;

        return $dto;
    }

    private function subResult(int $time): EventSubResultDto
    {
        $subResult = new EventSubResultDto();
        $subResult->eventDisciplineSubDistanceId = Uuid::v4();
        $subResult->time = $time;

        return $subResult;
    }
}
