<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\SaveStatusDto;
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class SaveStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertViolations(new SaveStatusDto(), ['status']);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(SaveStatusEnum $status): void
    {
        $dto = new SaveStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (SaveStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
