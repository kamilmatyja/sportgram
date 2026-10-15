<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserFilterDto;
use App\Enum\{CountryEnum, GenderEnum, UserStatusEnum};
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class UserFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new UserFilterDto();

        $this->assertNull($dto->firstName);
        $this->assertNull($dto->lastName);
        $this->assertNull($dto->gender);
        $this->assertNull($dto->email);
        $this->assertNull($dto->country);
        $this->assertNull($dto->status);
        $this->assertSame([], $dto->userIds);
        $this->assertNull($dto->link);
        $this->assertNull($dto->signId);
        $this->assertValid($dto);
    }

    final public function testFullyFilledIsValid(): void
    {
        $dto = new UserFilterDto();
        $dto->firstName = 'John';
        $dto->lastName = 'Doe';
        $dto->gender = GenderEnum::Male;
        $dto->email = 'john@example.com';
        $dto->country = CountryEnum::Poland;
        $dto->status = UserStatusEnum::Accepted;
        $dto->addUserId(Uuid::v7());
        $dto->addUserId(Uuid::v7());
        $dto->link = 'john';
        $dto->signId = Uuid::v7();

        $this->assertValid($dto);
    }

    final public function testAddUserIdAppends(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = new UserFilterDto();
        $dto->addUserId($first);
        $dto->addUserId($second);

        $this->assertSame([$first, $second], $dto->userIds);
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, mixed $value): void
    {
        $dto = new UserFilterDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        foreach (['firstName', 'lastName', 'link'] as $property) {
            yield "$property min" => [$property, 'a'];
            yield "$property max" => [$property, str_repeat('a', 64)];
        }

        yield 'email min' => ['email', 'a@b.c'];
        yield 'email max' => ['email', str_repeat('a', 59) . '@b.pl'];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = new UserFilterDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        foreach (['firstName', 'lastName', 'link'] as $property) {
            yield "$property empty" => [$property, ''];
            yield "$property too long" => [$property, str_repeat('a', 65)];
        }

        yield 'email invalid' => ['email', 'not-an-email'];
        yield 'email too long' => ['email', str_repeat('a', 60) . '@b.pl'];
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = new UserFilterDto();
        $dto->userIds = [Uuid::v7(), $userId];

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'not uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedUserIds(): void
    {
        $id = Uuid::v7();
        $dto = new UserFilterDto();
        $dto->userIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'userIds');
    }
}
