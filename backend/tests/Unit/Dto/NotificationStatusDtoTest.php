<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\NotificationStatusDto;
use App\Enum\NotificationStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class NotificationStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertOnlyViolation(new NotificationStatusDto(), 'status');
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(NotificationStatusEnum $status): void
    {
        $dto = new NotificationStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (NotificationStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
