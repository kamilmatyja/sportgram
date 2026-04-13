<?php

declare(strict_types=1);

namespace Tests\Factory;

use DateTimeImmutable;
use Faker\Factory as FakerFactory;
use Faker\Generator as FakerGenerator;
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

    protected static function uniqueInt(): int
    {
        return self::faker()->unique()->numberBetween(1, 2137);
    }

    protected static function uniqueCode(): int
    {
        return self::faker()->unique()->numberBetween(100000, 999999);
    }

    protected static function uniqueName(): string
    {
        return self::faker()->unique()->name;
    }

    protected static function uniqueEmail(): string
    {
        return self::faker()->unique()->email;
    }

    protected static function uniqueString(string $prefix): string
    {
        return sprintf('%s-%s', $prefix, self::faker()->unique()->uuid);
    }

    protected static function uniqueDate(): DateTimeImmutable
    {
        return new DateTimeImmutable(self::faker()->unique()->dateTimeThisDecade()->format('Y-m-dTH:i:sP'));
    }

    protected static function uniqueBinaryFileString(): string
    {
        return self::faker()->unique()->word;
    }

    protected static function uniqueId(): Uuid
    {
        return Uuid::fromString(self::faker()->unique()->uuid);
    }

    /**
     * @template T of UnitEnum
     * @param class-string<T> $class
     * @return T
     */
    protected static function uniqueEnum(string $class): UnitEnum
    {
        return self::faker()->randomElement($class::cases());
    }
}
