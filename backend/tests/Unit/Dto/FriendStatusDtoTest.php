<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FriendStatusDto;
use App\Enum\FriendStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class FriendStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertOnlyViolation(new FriendStatusDto(), 'status');
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(FriendStatusEnum $status): void
    {
        $dto = new FriendStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
