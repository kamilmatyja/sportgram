<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserCreateDto;
use App\Enum\{ColorEnum, CountryEnum, DisciplineEnum, GenderEnum, LanguageEnum, RoleEnum, ThemeEnum};
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;

class UserCreateDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new UserCreateDto();

        $this->assertSame([], $dto->roles);
        $this->assertSame([], $dto->disciplines);
    }

    final public function testEmptyDtoRequiresMandatoryFields(): void
    {
        $this->assertViolations(new UserCreateDto(), [
            'birthAt',
            'firstName',
            'lastName',
            'gender',
            'phone',
            'email',
            'password',
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

    final public function testValid(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testValidWithMultipleRolesAndDisciplines(): void
    {
        $dto = $this->validDto();
        $dto->addRole(RoleEnum::Organizer);
        $dto->addDiscipline(DisciplineEnum::Running);
        $dto->addDiscipline(DisciplineEnum::Swimming);

        $this->assertValid($dto);
    }

    final public function testAddMethodsAppend(): void
    {
        $dto = new UserCreateDto();
        $dto->addRole(RoleEnum::Participant);
        $dto->addRole(RoleEnum::Administrator);
        $dto->addDiscipline(DisciplineEnum::Cycling);
        $dto->addDiscipline(DisciplineEnum::Rowing);

        $this->assertSame([RoleEnum::Participant, RoleEnum::Administrator], $dto->roles);
        $this->assertSame([DisciplineEnum::Cycling, DisciplineEnum::Rowing], $dto->disciplines);
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
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
        yield 'email max' => ['email', str_repeat('a', 59) . '@b.pl'];
        yield 'password min' => ['password', str_repeat('a', 8)];
        yield 'password max' => ['password', str_repeat('a', 32)];
        yield 'link min' => ['link', 'abcde'];
        yield 'link max' => ['link', str_repeat('a', 64)];
        yield 'bio min' => ['bio', 'abcde'];
        yield 'bio max' => ['bio', str_repeat('a', 2048)];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'first name empty' => ['firstName', ''];
        yield 'first name too short' => ['firstName', 'ab'];
        yield 'first name too long' => ['firstName', str_repeat('a', 65)];
        yield 'last name empty' => ['lastName', ''];
        yield 'last name too short' => ['lastName', 'ab'];
        yield 'last name too long' => ['lastName', str_repeat('a', 65)];
        yield 'phone too short' => ['phone', 99999999];
        yield 'phone too long' => ['phone', 1000000000];
        yield 'phone negative' => ['phone', -123456789];
        yield 'email empty' => ['email', ''];
        yield 'email invalid' => ['email', 'not-an-email'];
        yield 'email too long' => ['email', str_repeat('a', 60) . '@b.pl'];
        yield 'password empty' => ['password', ''];
        yield 'password too short' => ['password', str_repeat('a', 7)];
        yield 'password too long' => ['password', str_repeat('a', 33)];
        yield 'link empty' => ['link', ''];
        yield 'link too short' => ['link', 'abcd'];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'link with invalid characters' => ['link', 'john.doe'];
        yield 'profile photo empty' => ['profilePhoto', ''];
        yield 'profile photo not base64' => ['profilePhoto', '!!!'];
        yield 'background photo empty' => ['backgroundPhoto', ''];
        yield 'background photo not base64' => ['backgroundPhoto', '!!!'];
        yield 'bio empty' => ['bio', ''];
        yield 'bio too short' => ['bio', 'abcd'];
        yield 'bio too long' => ['bio', str_repeat('a', 2049)];
        yield 'roles empty' => ['roles', []];
        yield 'roles duplicated' => ['roles', [RoleEnum::Participant, RoleEnum::Participant]];
        yield 'disciplines duplicated' => ['disciplines', [DisciplineEnum::Running, DisciplineEnum::Running]];
    }

    #[DataProvider('invalidCollectionItemProvider')]
    final public function testRejectsInvalidCollectionItem(string $property, array $value, string $path): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $path);
    }

    public static function invalidCollectionItemProvider(): iterable
    {
        yield 'role unknown' => ['roles', [RoleEnum::Participant, 99], 'roles[1]'];
        yield 'role raw value' => ['roles', [1], 'roles[0]'];
        yield 'role empty' => ['roles', [''], 'roles[0]'];
        yield 'discipline unknown' => ['disciplines', [DisciplineEnum::Running, 99], 'disciplines[1]'];
        yield 'discipline null' => ['disciplines', [null], 'disciplines[0]'];
    }

    #[DataProvider('enumProvider')]
    final public function testAcceptsEnumCase(string $property, mixed $case): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $case;

        $this->assertValid($dto);
    }

    public static function enumProvider(): iterable
    {
        $enums = [
            'gender' => GenderEnum::class,
            'language' => LanguageEnum::class,
            'country' => CountryEnum::class,
            'theme' => ThemeEnum::class,
            'color' => ColorEnum::class,
        ];

        foreach ($enums as $property => $enum) {
            foreach ($enum::cases() as $case) {
                yield "$property $case->name" => [$property, $case];
            }
        }

        foreach (RoleEnum::cases() as $case) {
            yield "roles $case->name" => ['roles', [$case]];
        }

        foreach (DisciplineEnum::cases() as $case) {
            yield "disciplines $case->name" => ['disciplines', [$case]];
        }
    }

    private function validDto(): UserCreateDto
    {
        $dto = new UserCreateDto();
        $dto->birthAt = new DateTimeImmutable('1990-05-15');
        $dto->firstName = 'John';
        $dto->lastName = 'Doe';
        $dto->gender = GenderEnum::Male;
        $dto->phone = 123456789;
        $dto->email = 'john@example.com';
        $dto->password = 'secret123';
        $dto->link = 'john-doe';
        $dto->language = LanguageEnum::English;
        $dto->country = CountryEnum::Poland;
        $dto->theme = ThemeEnum::Dark;
        $dto->color = ColorEnum::Blue;
        $dto->profilePhoto = base64_encode('profile');
        $dto->backgroundPhoto = base64_encode('background');
        $dto->bio = 'Runner and cyclist';
        $dto->addRole(RoleEnum::Participant);

        return $dto;
    }
}
