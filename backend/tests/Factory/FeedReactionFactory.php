<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\FeedReaction;
use App\Enum\{ElementStatusEnum, FeedReactionEnum};

final class FeedReactionFactory extends BaseFactory
{
    public static function make(array $overrides = []): FeedReaction
    {
        $defaults = [
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'reaction' => self::randomEnum(FeedReactionEnum::class),
            'status' => self::randomEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new FeedReaction(
            $data['feed'],
            $data['user'],
            $data['reaction'],
            $data['status'],
        );
    }
}
