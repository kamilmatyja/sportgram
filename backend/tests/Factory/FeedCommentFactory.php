<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\FeedComment;
use App\Enum\ElementStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class FeedCommentFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): FeedComment
    {
        $defaults = [
            'feed' => FeedFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'text' => self::randomString('text'),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new FeedComment(
            $data['feed'],
            $data['user'],
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
