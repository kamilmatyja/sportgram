<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\ConversationFilterDto;
use App\Enum\ConversationStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class ConversationFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new ConversationFilterDto();

        $this->assertNull($dto->status);
    }

    final public function testRequiresUserId(): void
    {
        $this->assertViolations(new ConversationFilterDto(), ['userId']);
    }

    final public function testValidWithUserIdOnly(): void
    {
        $dto = new ConversationFilterDto();
        $dto->userId = Uuid::v7();

        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(ConversationStatusEnum $status): void
    {
        $dto = new ConversationFilterDto();
        $dto->userId = Uuid::v7();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ConversationStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
