<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\EventDiscipline;
use App\Enum\DisciplineEnum;

final class EventDisciplineFactory extends BaseFactory
{
    public static function make(array $overrides = []): EventDiscipline
    {
        $defaults = [
            'event' => EventFactory::make(),
            'discipline' => self::randomEnum(DisciplineEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new EventDiscipline(
            $data['event'],
            $data['discipline']
        );
    }
}
