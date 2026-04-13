<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Friend;
use App\Enum\FriendStatusEnum;

final class FriendFactory extends BaseFactory
{
    public static function make(array $overrides = []): Friend
    {
        $defaults = [
            'senderUser' => UserFactory::make(),
            'receiverUser' => UserFactory::make(),
            'status' => self::uniqueEnum(FriendStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Friend(
            $data['senderUser'],
            $data['receiverUser'],
            $data['status']
        );
    }
}
