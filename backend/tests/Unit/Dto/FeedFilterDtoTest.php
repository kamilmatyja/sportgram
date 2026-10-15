<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FeedFilterDto;
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class FeedFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new FeedFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->text);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    final public function testFullyFilledIsValid(): void
    {
        $dto = new FeedFilterDto();
        $dto->userId = Uuid::v7();
        $dto->text = 'New post';
        $dto->status = ElementStatusEnum::Active;

        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(ElementStatusEnum $status): void
    {
        $dto = new FeedFilterDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('validTextProvider')]
    final public function testAcceptsTextWithinLimits(string $text): void
    {
        $dto = new FeedFilterDto();
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
        $dto = new FeedFilterDto();
        $dto->text = $text;

        $this->assertOnlyViolation($dto, 'text');
    }

    public static function invalidTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }
}
