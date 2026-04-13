<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Entry;
use App\Enum\EntryTypeEnum;

final class EntryFactory extends BaseFactory
{
    public static function make(array $overrides = []): Entry
    {
        $defaults = [
            'user' => UserFactory::make(),
            'entityId' => self::uniqueId(),
            'type' => self::uniqueEnum(EntryTypeEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Entry(
            $data['user'],
            $data['entityId'],
            $data['type']
        );
    }
}
