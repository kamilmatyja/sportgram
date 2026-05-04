<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Entry;
use App\Enum\EntryTypeEnum;
use Doctrine\ORM\EntityManagerInterface;

final class EntryFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Entry
    {
        $defaults = [
            'user' => UserFactory::make(em: $em),
            'entityId' => self::randomId(),
            'type' => self::randomEnum(EntryTypeEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Entry(
            $data['user'],
            $data['entityId'],
            $data['type'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
