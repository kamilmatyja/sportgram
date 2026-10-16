<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\StoryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class StoryDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new StoryDto(), ['text', 'photo']);
    }

    final public function testValidDtoPasses(): void
    {
        $this->assertValid(self::validDto());
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = self::validDto();
        $dto->text = 'a';
        $this->assertValid($dto);

        $dto->text = str_repeat('a', 2048);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = self::validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'empty text' => ['text', ''];
        yield 'text too long' => ['text', str_repeat('a', 2049)];
        yield 'empty photo' => ['photo', ''];
        yield 'photo not base64' => ['photo', '!!!'];
    }

    private static function validDto(): StoryDto
    {
        $dto = new StoryDto();
        $dto->text = 'My story';
        $dto->photo = base64_encode('photo-content');

        return $dto;
    }
}
