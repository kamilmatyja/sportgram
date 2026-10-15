<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\ConversationDto;
use PHPUnit\Framework\Attributes\DataProvider;

class ConversationDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresText(): void
    {
        $this->assertViolations(new ConversationDto(), ['text']);
    }

    #[DataProvider('validTextProvider')]
    final public function testAcceptsText(string $text): void
    {
        $this->assertValid($this->dtoWithText($text));
    }

    public static function validTextProvider(): iterable
    {
        yield 'single character' => ['a'];
        yield 'regular' => ['Hello, how are you?'];
        yield 'max length' => [str_repeat('a', 2048)];
    }

    #[DataProvider('invalidTextProvider')]
    final public function testRejectsText(string $text): void
    {
        $this->assertOnlyViolation($this->dtoWithText($text), 'text');
    }

    public static function invalidTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }

    private function dtoWithText(string $text): ConversationDto
    {
        $dto = new ConversationDto();
        $dto->text = $text;

        return $dto;
    }
}
