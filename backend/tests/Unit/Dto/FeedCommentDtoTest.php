<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FeedCommentDto;
use PHPUnit\Framework\Attributes\DataProvider;

class FeedCommentDtoTest extends DtoTestCase
{
    final public function testRequiresText(): void
    {
        $this->assertViolations(new FeedCommentDto(), ['text']);
    }

    #[DataProvider('validTextProvider')]
    final public function testAcceptsText(string $text): void
    {
        $dto = new FeedCommentDto();
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
        $dto = new FeedCommentDto();
        $dto->text = $text;

        $this->assertOnlyViolation($dto, 'text');
    }

    public static function invalidTextProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'too long' => [str_repeat('a', 2049)];
    }
}
