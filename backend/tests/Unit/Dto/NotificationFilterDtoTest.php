<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\NotificationFilterDto;
use App\Enum\NotificationStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class NotificationFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new NotificationFilterDto();

        $this->assertNull($dto->text);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    final public function testFullyFilledIsValid(): void
    {
        $dto = new NotificationFilterDto();
        $dto->text = 'new message';
        $dto->status = NotificationStatusEnum::Read;

        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(NotificationStatusEnum $status): void
    {
        $dto = new NotificationFilterDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (NotificationStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('validTextProvider')]
    final public function testAcceptsTextWithinLimits(string $text): void
    {
        $dto = new NotificationFilterDto();
        $dto->text = $text;

        $this->assertValid($dto);
    }

    public static function validTextProvider(): iterable
    {
        yield 'min length' => ['a'];
        yield 'max length' => [str_repeat('a', 2048)];
    }

    #[DataProvider('invalidTextProvider')]
    final public function testRejectsText(string $text): void
    {
        $dto = new NotificationFilterDto();
        $dto->text = $text;

        $this->assertOnlyViolation($dto, 'text');
    }

    public static function invalidTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }
}
