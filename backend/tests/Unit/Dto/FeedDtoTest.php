<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FeedDto;
use PHPUnit\Framework\Attributes\DataProvider;

class FeedDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new FeedDto(), ['photo', 'text']);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testAcceptsTextAtLengthLimits(): void
    {
        $dto = $this->validDto();

        $dto->text = 'a';
        $this->assertValid($dto);

        $dto->text = str_repeat('a', 2048);
        $this->assertValid($dto);
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'text empty' => ['text', ''];
        yield 'text too long' => ['text', str_repeat('a', 2049)];
        yield 'photo empty' => ['photo', ''];
        yield 'photo not base64' => ['photo', '!!!'];
        yield 'photo with illegal character' => ['photo', 'aGVsbG8*'];
    }

    private function validDto(): FeedDto
    {
        $dto = new FeedDto();
        $dto->text = 'New post';
        $dto->photo = base64_encode('image-bytes');

        return $dto;
    }
}
