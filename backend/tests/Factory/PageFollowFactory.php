<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PageFollow;
use App\Enum\PageFollowStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class PageFollowFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): PageFollow
    {
        $defaults = [
            'page' => $overrides['page'] ?? PageFactory::make(em: $em),
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'status' => self::randomEnum(PageFollowStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new PageFollow(
            $data['page'],
            $data['user'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
