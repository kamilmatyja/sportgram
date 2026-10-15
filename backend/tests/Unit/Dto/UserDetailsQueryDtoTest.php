<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\UserDetailsQueryDto;
use PHPUnit\Framework\Attributes\DataProvider;

class UserDetailsQueryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new UserDetailsQueryDto();

        $this->assertSame([], $dto->include);
        $this->assertValid($dto);
    }

    #[DataProvider('validIncludeProvider')]
    final public function testAcceptsInclude(array $include): void
    {
        $dto = new UserDetailsQueryDto();
        $dto->include = $include;

        $this->assertValid($dto);
    }

    public static function validIncludeProvider(): iterable
    {
        yield 'USER_DISCIPLINES' => [[UserDetailsQueryDto::USER_DISCIPLINES]];
        yield 'USER_ROLES' => [[UserDetailsQueryDto::USER_ROLES]];
        yield 'all' => [[UserDetailsQueryDto::USER_DISCIPLINES, UserDetailsQueryDto::USER_ROLES]];
    }

    #[DataProvider('invalidIncludeProvider')]
    final public function testRejectsInclude(array $include): void
    {
        $dto = new UserDetailsQueryDto();
        $dto->include = $include;

        $this->assertOnlyViolation($dto, 'include');
    }

    public static function invalidIncludeProvider(): iterable
    {
        yield 'unknown' => [['unknown']];
        yield 'unknown mixed with valid' => [[UserDetailsQueryDto::USER_DISCIPLINES, 'unknown']];
        yield 'wrong case' => [[strtoupper(UserDetailsQueryDto::USER_DISCIPLINES)]];
    }
}
