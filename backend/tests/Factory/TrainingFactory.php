<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Training;
use App\Enum\ElementStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class TrainingFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Training
    {
        $defaults = [
            'feed' => $overrides['feed'] ?? FeedFactory::make(em: $em),
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'startedAt' => self::randomData(),
            'endedAt' => self::randomData(),
            'title' => self::randomString('title'),
            'description' => self::randomString('description'),
            'link' => self::randomString('link'),
            'location' => self::randomString('location'),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Training(
            $data['feed'],
            $data['user'],
            $data['startedAt'],
            $data['endedAt'],
            $data['title'],
            $data['description'],
            $data['link'],
            $data['location'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
