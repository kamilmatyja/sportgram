<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserRegister;
use App\Enum\UnauthorizedStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class UserRegisterFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): UserRegister
    {
        $defaults = [
            'user' => UserFactory::make(em: $em),
            'code' => self::randomCode(),
            'attempt' => self::randomInt(),
            'status' => self::randomEnum(UnauthorizedStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new UserRegister(
            $data['user'],
            $data['code'],
            $data['attempt'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
