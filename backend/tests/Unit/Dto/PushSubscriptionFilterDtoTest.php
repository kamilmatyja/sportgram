<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PushSubscriptionFilterDto;
use PHPUnit\Framework\Attributes\DataProvider;

class PushSubscriptionFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new PushSubscriptionFilterDto();

        $this->assertNull($dto->endpoint);
        $this->assertNull($dto->p256dh);
        $this->assertNull($dto->auth);
        $this->assertValid($dto);
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, string $value): void
    {
        $dto = new PushSubscriptionFilterDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'endpoint min' => ['endpoint', 'a'];
        yield 'endpoint max' => ['endpoint', str_repeat('a', 2048)];
        yield 'p256dh min' => ['p256dh', 'a'];
        yield 'p256dh max' => ['p256dh', str_repeat('a', 256)];
        yield 'auth min' => ['auth', 'a'];
        yield 'auth max' => ['auth', str_repeat('a', 256)];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = new PushSubscriptionFilterDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'endpoint empty' => ['endpoint', ''];
        yield 'endpoint too long' => ['endpoint', str_repeat('a', 2049)];
        yield 'p256dh empty' => ['p256dh', ''];
        yield 'p256dh too long' => ['p256dh', str_repeat('a', 257)];
        yield 'auth empty' => ['auth', ''];
        yield 'auth too long' => ['auth', str_repeat('a', 257)];
    }
}
