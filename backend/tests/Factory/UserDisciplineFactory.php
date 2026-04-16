<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserDiscipline;
use App\Enum\DisciplineEnum;

final class UserDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = []): UserDiscipline
    {
        $defaults = [
            'user' => UserFactory::make(),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new UserDiscipline(
            $data['user'],
            $data['discipline'],
        );
    }
}
