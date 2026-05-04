<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Conversation;
use App\Enum\ConversationStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class ConversationFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Conversation
    {
        $defaults = [
            'senderUser' => UserFactory::make(em: $em),
            'receiverUser' => UserFactory::make(em: $em),
            'text' => self::randomString('text'),
            'status' => self::randomEnum(ConversationStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Conversation(
            $data['senderUser'],
            $data['receiverUser'],
            $data['text'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
