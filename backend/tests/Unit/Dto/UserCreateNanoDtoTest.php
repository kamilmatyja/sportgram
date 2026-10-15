<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserCreateNanoDto;
use App\Enum\{CountryEnum, GenderEnum, RoleEnum};
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;

class UserCreateNanoDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $this->assertSame([], new UserCreateNanoDto()->roles);
    }

    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new UserCreateNanoDto(), [
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'password',
            'country',
            'roles',
        ]);
    }

    final public function testValidDtoPasses(): void
    {
        $this->assertValid(self::validDto());
    }

    #[DataProvider('nanoRoleProvider')]
    final public function testAcceptsNanoRole(RoleEnum $role): void
    {
        $dto = self::validDto();
        $dto->roles = [$role];

        $this->assertValid($dto);
    }

    public static function nanoRoleProvider(): iterable
    {
        foreach (RoleEnum::nano() as $role) {
            yield $role->name => [$role];
        }
    }

    final public function testAddRoleAppendsItems(): void
    {
        $dto = new UserCreateNanoDto();
        $dto->addRole(RoleEnum::Participant);
        $dto->addRole(RoleEnum::Organizer);

        $this->assertSame([RoleEnum::Participant, RoleEnum::Organizer], $dto->roles);
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, mixed $value): void
    {
        $dto = self::validDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'first name min' => ['firstName', 'abc'];
        yield 'first name max' => ['firstName', str_repeat('a', 64)];
        yield 'last name min' => ['lastName', 'abc'];
        yield 'last name max' => ['lastName', str_repeat('a', 64)];
        yield 'phone min' => ['phone', 100000000];
        yield 'phone max' => ['phone', 999999999];
        yield 'email min' => ['email', 'a@b.c'];
        yield 'email max' => ['email', str_repeat('a', 58) . '@b.com'];
        yield 'password min' => ['password', str_repeat('a', 8)];
        yield 'password max' => ['password', str_repeat('a', 32)];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value, string $path): void
    {
        $dto = self::validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $path);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'first name empty' => ['firstName', '', 'firstName'];
        yield 'first name too short' => ['firstName', 'ab', 'firstName'];
        yield 'first name too long' => ['firstName', str_repeat('a', 65), 'firstName'];
        yield 'last name empty' => ['lastName', '', 'lastName'];
        yield 'last name too short' => ['lastName', 'ab', 'lastName'];
        yield 'last name too long' => ['lastName', str_repeat('a', 65), 'lastName'];
        yield 'phone too small' => ['phone', 99999999, 'phone'];
        yield 'phone too big' => ['phone', 1000000000, 'phone'];
        yield 'email empty' => ['email', '', 'email'];
        yield 'email invalid' => ['email', 'not-an-email', 'email'];
        yield 'email too long' => ['email', str_repeat('a', 59) . '@b.com', 'email'];
        yield 'password empty' => ['password', '', 'password'];
        yield 'password too short' => ['password', str_repeat('a', 7), 'password'];
        yield 'password too long' => ['password', str_repeat('a', 33), 'password'];
        yield 'roles empty' => ['roles', [], 'roles'];
        yield 'roles not nano' => ['roles', [RoleEnum::Administrator], 'roles[0]'];
        yield 'roles invalid item' => ['roles', [RoleEnum::Participant, 'admin'], 'roles[1]'];
        yield 'roles null item' => ['roles', [null], 'roles[0]'];
        yield 'roles duplicated' => ['roles', [RoleEnum::Participant, RoleEnum::Participant], 'roles'];
    }

    private static function validDto(): UserCreateNanoDto
    {
        $dto = new UserCreateNanoDto();
        $dto->birthAt = new DateTimeImmutable('1990-01-01');
        $dto->firstName = 'John';
        $dto->lastName = 'Smith';
        $dto->gender = GenderEnum::Male;
        $dto->phone = 123456789;
        $dto->email = 'john@example.com';
        $dto->password = 'secret123';
        $dto->country = CountryEnum::Albania;
        $dto->addRole(RoleEnum::Participant);

        return $dto;
    }
}
