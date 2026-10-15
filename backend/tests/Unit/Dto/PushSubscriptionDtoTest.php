<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\PushSubscriptionDto;
use App\Enum\PushSubscriptionStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;

class PushSubscriptionDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllMandatoryFields(): void
    {
        $dto = new PushSubscriptionDto();

        $this->assertNull($dto->userAgent);
        $this->assertViolations($dto, ['endpoint', 'p256dh', 'auth', 'status']);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(PushSubscriptionStatusEnum $status): void
    {
        $dto = $this->validDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (PushSubscriptionStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = $this->validDto();
        $dto->endpoint = str_repeat('a', 4);
        $dto->p256dh = str_repeat('a', 4);
        $dto->auth = str_repeat('a', 4);
        $dto->userAgent = str_repeat('a', 4);

        $this->assertValid($dto);

        $dto->endpoint = str_repeat('a', 2048);
        $dto->p256dh = str_repeat('a', 256);
        $dto->auth = str_repeat('a', 256);
        $dto->userAgent = str_repeat('a', 1024);

        $this->assertValid($dto);
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
        foreach (['endpoint' => 2048, 'p256dh' => 256, 'auth' => 256] as $property => $max) {
            yield "empty $property" => [$property, ''];
            yield "$property too short" => [$property, 'abc'];
            yield "$property too long" => [$property, str_repeat('a', $max + 1)];
        }

        yield 'userAgent empty' => ['userAgent', ''];
        yield 'userAgent too short' => ['userAgent', 'abc'];
        yield 'userAgent too long' => ['userAgent', str_repeat('a', 1025)];
    }

    private function validDto(): PushSubscriptionDto
    {
        $dto = new PushSubscriptionDto();
        $dto->endpoint = 'https://push.example.com/send/abc';
        $dto->p256dh = 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA';
        $dto->auth = 'tBHItJI5svbpez7KI4CCXg';
        $dto->userAgent = 'Mozilla/5.0';
        $dto->status = PushSubscriptionStatusEnum::Active;

        return $dto;
    }
}
