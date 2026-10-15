<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventDisciplineSubDistanceDto;
use PHPUnit\Framework\Attributes\DataProvider;

class EventDisciplineSubDistanceDtoTest extends DtoTestCase
{
    final public function testRequiresSubDistance(): void
    {
        $this->assertViolations(new EventDisciplineSubDistanceDto(), ['subDistance']);
    }

    #[DataProvider('validSubDistanceProvider')]
    final public function testAcceptsSubDistance(int $subDistance): void
    {
        $dto = new EventDisciplineSubDistanceDto();
        $dto->subDistance = $subDistance;

        $this->assertSame($subDistance, $dto->subDistance);
        $this->assertValid($dto);
    }

    public static function validSubDistanceProvider(): iterable
    {
        yield 'positive' => [100];
        yield 'one' => [1];
        yield 'zero is not blank' => [0];
    }
}
