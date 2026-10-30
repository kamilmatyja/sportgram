<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PushSubscriptionStatusDto;
use App\Enum\PushSubscriptionStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class PushSubscriptionStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertOnlyViolation(new PushSubscriptionStatusDto(), 'status');
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(PushSubscriptionStatusEnum $status): void
    {
        $dto = new PushSubscriptionStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (PushSubscriptionStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
