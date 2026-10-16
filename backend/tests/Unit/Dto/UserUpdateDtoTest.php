<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserUpdateDto;
use App\Enum\{ColorEnum, CountryEnum, DisciplineEnum, GenderEnum, LanguageEnum, RoleEnum, ThemeEnum};
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;

class UserUpdateDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new UserUpdateDto();

        $this->assertNull($dto->password);
        $this->assertSame([], $dto->roles);
        $this->assertSame([], $dto->disciplines);
    }

    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new UserUpdateDto(), [
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'link',
            'language',
            'country',
            'theme',
            'color',
            'profilePhoto',
            'backgroundPhoto',
            'bio',
            'roles',
        ]);
    }

    final public function testValidDtoPasses(): void
    {
        $this->assertValid(self::validDto());
    }

    final public function testAddMethodsAppendItems(): void
    {
        $dto = new UserUpdateDto();
        $dto->addRole(RoleEnum::Participant);
        $dto->addRole(RoleEnum::Administrator);
        $dto->addDiscipline(DisciplineEnum::Running);
        $dto->addDiscipline(DisciplineEnum::Cycling);

        $this->assertSame([RoleEnum::Participant, RoleEnum::Administrator], $dto->roles);
        $this->assertSame([DisciplineEnum::Running, DisciplineEnum::Cycling], $dto->disciplines);
    }

    final public function testAcceptsAllRolesAndDisciplines(): void
    {
        $dto = self::validDto();
        $dto->roles = RoleEnum::cases();
        $dto->disciplines = DisciplineEnum::cases();

        $this->assertValid($dto);
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
        yield 'password null' => ['password', null];
        yield 'password min' => ['password', str_repeat('a', 8)];
        yield 'password max' => ['password', str_repeat('a', 32)];
        yield 'link min' => ['link', 'ab-12'];
        yield 'link max' => ['link', str_repeat('A', 64)];
        yield 'bio min' => ['bio', str_repeat('a', 5)];
        yield 'bio max' => ['bio', str_repeat('a', 2048)];
        yield 'no disciplines' => ['disciplines', []];
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
        yield 'password too short' => ['password', str_repeat('a', 7), 'password'];
        yield 'password too long' => ['password', str_repeat('a', 33), 'password'];
        yield 'link empty' => ['link', '', 'link'];
        yield 'link too short' => ['link', 'abcd', 'link'];
        yield 'link too long' => ['link', str_repeat('a', 65), 'link'];
        yield 'link with forbidden chars' => ['link', 'my_link', 'link'];
        yield 'link with spaces' => ['link', 'my link', 'link'];
        yield 'profile photo empty' => ['profilePhoto', '', 'profilePhoto'];
        yield 'profile photo not base64' => ['profilePhoto', '!!!', 'profilePhoto'];
        yield 'background photo empty' => ['backgroundPhoto', '', 'backgroundPhoto'];
        yield 'background photo not base64' => ['backgroundPhoto', '!!!', 'backgroundPhoto'];
        yield 'bio empty' => ['bio', '', 'bio'];
        yield 'bio too short' => ['bio', 'abcd', 'bio'];
        yield 'bio too long' => ['bio', str_repeat('a', 2049), 'bio'];
        yield 'roles empty' => ['roles', [], 'roles'];
        yield 'roles invalid item' => ['roles', [RoleEnum::Participant, 'admin'], 'roles[1]'];
        yield 'roles null item' => ['roles', [null], 'roles[0]'];
        yield 'roles duplicated' => ['roles', [RoleEnum::Organizer, RoleEnum::Organizer], 'roles'];
        yield 'disciplines invalid item' => ['disciplines', ['running'], 'disciplines[0]'];
        yield 'disciplines null item' => ['disciplines', [DisciplineEnum::Running, null], 'disciplines[1]'];
        yield 'disciplines duplicated' => ['disciplines', [DisciplineEnum::Rowing, DisciplineEnum::Rowing], 'disciplines'];
    }

    private static function validDto(): UserUpdateDto
    {
        $dto = new UserUpdateDto();
        $dto->birthAt = new DateTimeImmutable('1990-01-01');
        $dto->firstName = 'John';
        $dto->lastName = 'Smith';
        $dto->gender = GenderEnum::Female;
        $dto->phone = 123456789;
        $dto->email = 'john@example.com';
        $dto->link = 'john-smith-1';
        $dto->language = LanguageEnum::Polish;
        $dto->country = CountryEnum::Albania;
        $dto->theme = ThemeEnum::Dark;
        $dto->color = ColorEnum::Blue;
        $dto->profilePhoto = base64_encode('profile');
        $dto->backgroundPhoto = base64_encode('background');
        $dto->bio = 'Runner and cyclist';
        $dto->addRole(RoleEnum::Participant);
        $dto->addDiscipline(DisciplineEnum::Running);

        return $dto;
    }
}
