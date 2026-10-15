<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PageFollowStatusDto;
use App\Enum\PageFollowStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class PageFollowStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertViolations(new PageFollowStatusDto(), ['status']);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(PageFollowStatusEnum $status): void
    {
        $dto = new PageFollowStatusDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (PageFollowStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
