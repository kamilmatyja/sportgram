<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\GoalParticipant;
use App\Enum\SaveStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class GoalParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): GoalParticipant
    {
        $defaults = [
            'goal' => GoalFactory::make(em: $em),
            'user' => UserFactory::make(em: $em),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new GoalParticipant(
            $data['goal'],
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
