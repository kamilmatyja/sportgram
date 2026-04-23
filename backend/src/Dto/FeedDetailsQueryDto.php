<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'FeedDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::FEED_COMMENTS], nullable: true),
    ],
    type: 'object',
)]
class FeedDetailsQueryDto
{
    public const string FEED_COMMENTS = 'feedComments';

    public const string FEED_REACTIONS = 'feedReactions';

    /** @var string[] */
    #[Assert\Choice(choices: [self::FEED_COMMENTS, self::FEED_REACTIONS], multiple: true)]
    public array $include = [];
}
