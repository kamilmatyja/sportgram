<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\Page;
use App\Enum\{ColorEnum, ElementStatusEnum};
use Doctrine\ORM\EntityManagerInterface;

final class PageFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): Page
    {
        $defaults = [
            'user' => UserFactory::make(em: $em),
            'title' => self::randomString('title'),
            'description' => self::randomString('description'),
            'link' => self::randomString('link'),
            'profilePhoto' => self::randoBinary(),
            'backgroundPhoto' => self::randoBinary(),
            'color' => self::randomEnum(ColorEnum::class),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new Page(
            $data['user'],
            $data['title'],
            $data['description'],
            $data['link'],
            $data['profilePhoto'],
            $data['backgroundPhoto'],
            $data['color'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
