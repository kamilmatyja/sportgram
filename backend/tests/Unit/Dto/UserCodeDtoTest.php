<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserCodeDto;
use PHPUnit\Framework\Attributes\DataProvider;

class UserCodeDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresCode(): void
    {
        $this->assertViolations(new UserCodeDto(), ['code']);
    }

    #[DataProvider('validCodeProvider')]
    final public function testAcceptsCode(int $code): void
    {
        $this->assertValid($this->dtoWithCode($code));
    }

    public static function validCodeProvider(): iterable
    {
        yield 'min' => [100000];
        yield 'regular' => [213700];
        yield 'max' => [999999];
    }

    #[DataProvider('invalidCodeProvider')]
    final public function testRejectsCode(int $code): void
    {
        $this->assertOnlyViolation($this->dtoWithCode($code), 'code');
    }

    public static function invalidCodeProvider(): iterable
    {
        yield 'zero' => [0];
        yield 'negative' => [-213700];
        yield 'below min' => [99999];
        yield 'above max' => [1000000];
    }

    private function dtoWithCode(int $code): UserCodeDto
    {
        $dto = new UserCodeDto();
        $dto->code = $code;

        return $dto;
    }
}
