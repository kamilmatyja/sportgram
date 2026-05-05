<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\TrainingParticipant;
use App\Enum\SaveStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class TrainingParticipantFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): TrainingParticipant
    {
        $defaults = [
            'training' => $overrides['training'] ?? TrainingFactory::make(em: $em),
            'user' => $overrides['user'] ?? UserFactory::make(em: $em),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new TrainingParticipant(
            $data['training'],
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
