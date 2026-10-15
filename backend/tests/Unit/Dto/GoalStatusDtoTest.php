<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\GoalStatusDto;
use App\Enum\GoalStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class GoalStatusDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresStatus(): void
    {
        $this->assertViolations(new GoalStatusDto(), ['status']);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsEveryStatus(GoalStatusEnum $status): void
    {
        $dto = new GoalStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (GoalStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
