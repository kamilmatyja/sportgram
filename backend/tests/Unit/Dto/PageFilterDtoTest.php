<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PageFilterDto;
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class PageFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PageFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->link);
        $this->assertNull($dto->title);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testFilledFilterIsValid(ElementStatusEnum $status): void
    {
        $dto = new PageFilterDto();
        $dto->userId = Uuid::v4();
        $dto->link = str_repeat('a', 64);
        $dto->title = str_repeat('a', 2048);
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testMinimalLengthsAreValid(): void
    {
        $dto = new PageFilterDto();
        $dto->link = 'a';
        $dto->title = 'a';

        $this->assertValid($dto);
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = new PageFilterDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'empty link' => ['link', ''];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'empty title' => ['title', ''];
        yield 'title too long' => ['title', str_repeat('a', 2049)];
    }
}
