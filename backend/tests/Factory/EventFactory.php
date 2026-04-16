<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Event;
use App\Enum\ElementStatusEnum;

final class EventFactory extends BaseFactory
{
    public static function make(array $overrides = []): Event
    {
        $defaults = [
            'pageParticipant' => PageParticipantFactory::make(),
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

        return new Event(
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
    }
}
