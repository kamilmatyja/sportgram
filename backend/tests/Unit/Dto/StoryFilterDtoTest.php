<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\StoryFilterDto;
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class StoryFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new StoryFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->text);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsFullFilter(ElementStatusEnum $status): void
    {
        $dto = new StoryFilterDto();
        $dto->userId = Uuid::v4();
        $dto->text = 'story';
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testTextBoundaryValuesAreValid(): void
    {
        $dto = new StoryFilterDto();
        $dto->text = 'a';
        $this->assertValid($dto);

        $dto->text = str_repeat('a', 2048);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidTextProvider')]
    final public function testRejectsInvalidText(string $text): void
    {
        $dto = new StoryFilterDto();
        $dto->text = $text;

        $this->assertOnlyViolation($dto, 'text');
    }

    public static function invalidTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }
}
