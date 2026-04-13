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
            'startedAt' => self::uniqueDate(),
            'endedAt' => self::uniqueDate(),
            'title' => self::uniqueString('title'),
            'description' => self::uniqueString('description'),
            'link' => self::uniqueString('link'),
            'rules' => self::uniqueString('rules'),
            'photo' => self::uniqueBinaryFileString(),
            'location' => self::uniqueString('location'),
            'status' => self::uniqueEnum(ElementStatusEnum::class),
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
            $data['status']
        );
    }
}
