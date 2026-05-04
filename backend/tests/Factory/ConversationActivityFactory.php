<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\ConversationActivity;
use Doctrine\ORM\EntityManagerInterface;

final class ConversationActivityFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): ConversationActivity
    {
        $defaults = [
            'senderUser' => UserFactory::make(em: $em),
            'receiverUser' => UserFactory::make(em: $em),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new ConversationActivity(
            $data['senderUser'],
            $data['receiverUser'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
