<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Conversation;
use App\Enum\ConversationStatusEnum;

final class ConversationFactory extends BaseFactory
{
    public static function make(array $overrides = []): Conversation
    {
        $defaults = [
            'senderUser' => UserFactory::make(),
            'receiverUser' => UserFactory::make(),
            'text' => self::randomString('text'),
            'status' => self::randomEnum(ConversationStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new Conversation(
            $data['senderUser'],
            $data['receiverUser'],
            $data['text'],
            $data['status'],
        );
    }
}
