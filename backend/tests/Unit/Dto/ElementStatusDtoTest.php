<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\ElementStatusDto;
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class ElementStatusDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresStatus(): void
    {
        $this->assertViolations(new ElementStatusDto(), ['status']);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsEveryStatus(ElementStatusEnum $status): void
    {
        $dto = new ElementStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
