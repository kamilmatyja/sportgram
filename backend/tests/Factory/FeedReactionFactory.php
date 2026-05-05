<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\FeedReaction;
use App\Enum\{ElementStatusEnum, FeedReactionEnum};
use Doctrine\ORM\EntityManagerInterface;

final class FeedReactionFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): FeedReaction
    {
        $defaults = [
            'feed' => $overrides['feed'] ?? FeedFactory::make(em: $em),
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'reaction' => self::randomEnum(FeedReactionEnum::class),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new FeedReaction(
            $data['feed'],
            $data['user'],
            $data['reaction'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
