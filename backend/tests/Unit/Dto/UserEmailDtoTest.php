<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserEmailDto;
use PHPUnit\Framework\Attributes\DataProvider;

class UserEmailDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresEmail(): void
    {
        $this->assertViolations(new UserEmailDto(), ['email']);
    }

    #[DataProvider('validEmailProvider')]
    final public function testAcceptsEmail(string $email): void
    {
        $this->assertValid($this->dtoWithEmail($email));
    }

    public static function validEmailProvider(): iterable
    {
        yield 'regular' => ['jan@kowalski.pl'];
        yield 'min length' => ['a@b.c'];
        yield 'max length' => [str_repeat('a', 58) . '@ab.pl'];
    }

    #[DataProvider('invalidEmailProvider')]
    final public function testRejectsEmail(string $email): void
    {
        $this->assertOnlyViolation($this->dtoWithEmail($email), 'email');
    }

    public static function invalidEmailProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'without at' => ['jan.kowalski.pl'];
        yield 'without domain' => ['jan@'];
        yield 'too long' => [str_repeat('a', 59) . '@ab.pl'];
    }

    private function dtoWithEmail(string $email): UserEmailDto
    {
        $dto = new UserEmailDto();
        $dto->email = $email;

        return $dto;
    }
}
