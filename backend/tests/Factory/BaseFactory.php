<?php

declare(strict_types=1);

namespace Tests\Factory;

use DateTimeImmutable;
use Faker\{Factory as FakerFactory, Generator as FakerGenerator};
use Symfony\Component\Uid\Uuid;
use UnitEnum;

abstract class BaseFactory
{
    /**
     * @var FakerGenerator|null
     */
    protected static ?FakerGenerator $faker = null;

    protected static function faker(): FakerGenerator
    {
        if (self::$faker === null) {
            self::$faker = FakerFactory::create();
        }

        return self::$faker;
    }

    protected static function randomInt(): int
    {
        return self::faker()->numberBetween(1, 2137);
    }

    protected static function randomPhone(): int
    {
        return self::faker()->numberBetween(100000000, 999999999.);
    }

    protected static function randomCode(): int
    {
        return self::faker()->numberBetween(100000, 999999);
    }

    protected static function randomName(): string
    {
        return self::faker()->name;
    }

    protected static function randomEmail(): string
    {
        return self::faker()->email;
    }

    protected static function randomString(string $prefix): string
    {
        return sprintf('%s-%s', $prefix, self::faker()->uuid);
    }

    protected static function randomData(): DateTimeImmutable
    {
        return new DateTimeImmutable(self::faker()->dateTimeThisDecade()->format('Y-m-dTH:i:sP'));
    }

    protected static function randoBinary(): string
    {
        return self::faker()->word;
    }

    protected static function randomId(): Uuid
    {
        return Uuid::fromString(self::faker()->uuid);
    }

    /**
     * @template T of UnitEnum
     * @param class-string<T> $class
     * @return T
     */
    protected static function randomEnum(string $class): UnitEnum
    {
        return self::faker()->randomElement($class::cases());
    }
}
