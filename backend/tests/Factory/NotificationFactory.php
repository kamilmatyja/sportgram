<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Notification;
use App\Enum\NotificationStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class NotificationFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Notification
    {
        $defaults = [
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'text' => self::randomString('text'),
            'link' => self::randomString('link'),
            'status' => self::randomEnum(NotificationStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Notification(
            $data['user'],
            $data['text'],
            $data['link'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
