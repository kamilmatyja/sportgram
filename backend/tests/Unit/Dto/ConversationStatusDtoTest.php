<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\ConversationStatusDto;
use App\Enum\ConversationStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class ConversationStatusDtoTest extends DtoTestCase
{
    final public function testRequiresStatus(): void
    {
        $this->assertOnlyViolation(new ConversationStatusDto(), 'status');
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(ConversationStatusEnum $status): void
    {
        $dto = new ConversationStatusDto();
        $dto->status = $status;

        $this->assertSame($status, $dto->status);
        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ConversationStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
