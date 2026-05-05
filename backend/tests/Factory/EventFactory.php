<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Event;
use App\Enum\ElementStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class EventFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Event
    {
        $defaults = [
            'pageParticipant' => $overrides['pageParticipant'] ?? PageParticipantFactory::make(em: $em),
            'startedAt' => self::randomData(),
            'endedAt' => self::randomData(),
            'title' => self::randomString('title'),
            'description' => self::randomString('description'),
            'link' => self::randomString('link'),
            'rules' => self::randomString('rules'),
            'photo' => self::randoBinary(),
            'location' => self::randomString('location'),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Event(
            $data['pageParticipant'],
            $data['startedAt'],
            $data['endedAt'],
            $data['title'],
            $data['description'],
            $data['link'],
            $data['rules'],
            $data['photo'],
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
