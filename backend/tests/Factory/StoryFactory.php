<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Story;
use App\Enum\ElementStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class StoryFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Story
    {
        $defaults = [
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'text' => self::randomString('text'),
            'photo' => self::randoBinary(),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Story(
            $data['user'],
            $data['text'],
            $data['photo'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
