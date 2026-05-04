<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\GoalParticipantResult;
use App\Enum\SaveStatusEnum;
use Doctrine\ORM\EntityManagerInterface;

final class GoalParticipantResultFactory extends BaseFactory
{
    public static function make(array $overrides = [], ?EntityManagerInterface $em = null): GoalParticipantResult
    {
        $defaults = [
            'goalParticipant' => GoalParticipantFactory::make(em: $em),
            'feed' => FeedFactory::make(em: $em),
            'distance' => self::randomInt(),
            'time' => self::randomInt(),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        $object = new GoalParticipantResult(
            $data['goalParticipant'],
            $data['feed'],
            $data['distance'],
            $data['time'],
            $data['status'],
        );

        if ($em) {
            $em->persist($object);
            $em->flush();
        }

        return $object;
    }
}
