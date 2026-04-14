<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\GoalParticipantResult;
use App\Enum\SaveStatusEnum;

final class GoalParticipantResultFactory extends BaseFactory
{
    public static function make(array $overrides = []): GoalParticipantResult
    {
        $defaults = [
            'goalParticipant' => GoalParticipantFactory::make(),
            'feed' => FeedFactory::make(),
            'status' => self::randomEnum(SaveStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new GoalParticipantResult(
            $data['goalParticipant'],
            $data['feed'],
            $data['status']
        );
    }
}
