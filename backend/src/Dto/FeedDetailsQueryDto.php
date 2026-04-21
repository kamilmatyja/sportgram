<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'FeedDetailsQueryDto')]
class FeedDetailsQueryDto
{
    public const string FEED_COMMENTS = 'feedComments';

    public const string FEED_REACTIONS = 'feedReactions';

    #[Assert\Choice(choices: [self::FEED_COMMENTS, self::FEED_REACTIONS])]
    #[OA\Property(description: 'Include related entities', example: self::FEED_COMMENTS)]
    public ?string $include = null;
}
