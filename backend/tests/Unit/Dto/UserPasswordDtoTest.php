<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserPasswordDto;
use PHPUnit\Framework\Attributes\DataProvider;

class UserPasswordDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new UserPasswordDto(), ['password', 'code']);
    }

    #[DataProvider('validValueProvider')]
    final public function testAcceptsValue(string $password, int $code): void
    {
        $dto = new UserPasswordDto();
        $dto->password = $password;
        $dto->code = $code;

        $this->assertValid($dto);
    }

    public static function validValueProvider(): iterable
    {
        yield 'minimal' => [str_repeat('a', 8), 100000];
        yield 'maximal' => [str_repeat('a', 32), 999999];
        yield 'typical' => ['Secret#123', 123456];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new UserPasswordDto();
        $dto->password = 'Secret#123';
        $dto->code = 123456;
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'empty password' => ['password', ''];
        yield 'password too short' => ['password', str_repeat('a', 7)];
        yield 'password too long' => ['password', str_repeat('a', 33)];
        yield 'code too small' => ['code', 99999];
        yield 'code too big' => ['code', 1000000];
        yield 'code zero' => ['code', 0];
    }
}
