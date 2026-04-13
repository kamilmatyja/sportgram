<?php

declare(strict_types=1);

namespace Tests\Factory;

use App\Entity\FeedComment;
use App\Enum\ElementStatusEnum;

final class FeedCommentFactory extends BaseFactory
{
    public static function make(array $overrides = []): FeedComment
    {
        $defaults = [
            'feed' => FeedFactory::make(),
            'user' => UserFactory::make(),
            'text' => self::uniqueString('text'),
            'status' => self::uniqueEnum(ElementStatusEnum::class),
        ];

        $data = array_replace($defaults, $overrides);

        return new FeedComment(
            $data['feed'],
            $data['user'],
            $data['text'],
            $data['status']
        );
    }
}
