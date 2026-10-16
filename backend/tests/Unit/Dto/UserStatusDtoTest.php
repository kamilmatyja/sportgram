<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserStatusDto;
use App\Enum\UserStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class UserStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertViolations(new UserStatusDto(), ['status']);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(UserStatusEnum $status): void
    {
        $dto = new UserStatusDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (UserStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
