<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Friend;
use App\Enum\FriendStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class FriendFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Friend
    {
        $defaults = [
            'senderUser' => $overrides['senderUser'] ?? UserFactory::make(em: $em),
            'receiverUser' => $overrides['receiverUser'] ?? UserFactory::make(em: $em),
            'status' => self::randomEnum(FriendStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Friend(
            $data['senderUser'],
            $data['receiverUser'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
