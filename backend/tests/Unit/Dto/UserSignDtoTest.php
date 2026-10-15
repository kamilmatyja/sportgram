<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserSignDto;
use PHPUnit\Framework\Attributes\DataProvider;

class UserSignDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new UserSignDto(), ['email', 'password']);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, string $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'email min' => ['email', 'a@b.c'];
        yield 'email max' => ['email', str_repeat('a', 58) . '@ab.pl'];
        yield 'password min' => ['password', str_repeat('a', 8)];
        yield 'password max' => ['password', str_repeat('a', 32)];
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
        yield 'email empty' => ['email', ''];
        yield 'email malformed' => ['email', 'jan.kowalski.pl'];
        yield 'email too long' => ['email', str_repeat('a', 59) . '@ab.pl'];
        yield 'password empty' => ['password', ''];
        yield 'password too short' => ['password', str_repeat('a', 7)];
        yield 'password too long' => ['password', str_repeat('a', 33)];
    }

    private function validDto(): UserSignDto
    {
        $dto = new UserSignDto();
        $dto->email = 'jan@kowalski.pl';
        $dto->password = 'password123';

        return $dto;
    }
}
