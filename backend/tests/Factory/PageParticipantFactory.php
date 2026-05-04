<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\PageParticipant;
use App\Enum\SaveStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class PageParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): PageParticipant
    {
        $defaults = [
            'page' => PageFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new PageParticipant(
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
