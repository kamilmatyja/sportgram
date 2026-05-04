<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\UserPasswordReset;
use App\Enum\UnauthorizedStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class UserPasswordResetFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): UserPasswordReset
    {
        $defaults = [
            'user' => UserFactory::make(em: $em),
            'code' => self::randomCode(),
            'attempt' => self::randomInt(),
            'status' => self::randomEnum(UnauthorizedStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new UserPasswordReset(
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
