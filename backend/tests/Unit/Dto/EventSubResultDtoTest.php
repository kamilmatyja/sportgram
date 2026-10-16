<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventSubResultDto;
use Symfony\Component\Uid\Uuid;

class EventSubResultDtoTest extends DtoTestCase
{
    final public function testRequiresAllFields(): void
    {
        $this->assertViolations(new EventSubResultDto(), ['eventDisciplineSubDistanceId', 'time']);
    }

    final public function testValid(): void
    {
        $dto = new EventSubResultDto();
        $dto->eventDisciplineSubDistanceId = Uuid::v4();
        $dto->time = 60;

        $this->assertValid($dto);
    }

    final public function testZeroTimeIsNotBlank(): void
    {
        $dto = new EventSubResultDto();
        $dto->eventDisciplineSubDistanceId = Uuid::v4();
        $dto->time = 0;

        $this->assertValid($dto);
    }

    final public function testRequiresTime(): void
    {
        $dto = new EventSubResultDto();
        $dto->eventDisciplineSubDistanceId = Uuid::v4();

        $this->assertOnlyViolation($dto, 'time');
    }
}
