<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\ConversationActivity;

final class ConversationActivityFactory extends BaseFactory
{
    public static function make(array $overrides = []): ConversationActivity
    {
        $defaults = [
            'senderUser' => UserFactory::make(),
            'receiverUser' => UserFactory::make(),
        ];

        $data = array_replace($defaults, $overrides);

        return new ConversationActivity(
            $data['senderUser'],
            $data['receiverUser']
        );
    }
}
