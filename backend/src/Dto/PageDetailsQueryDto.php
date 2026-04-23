<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'PageDetailsQueryDto',
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::PAGE_PARTICIPANTS], nullable: true),
    ],
    type: 'object',
)]
class PageDetailsQueryDto
{
    public const string PAGE_PARTICIPANTS = 'pageParticipants';

    public const string PAGE_FOLLOWS = 'pageFollows';

    /** @var string[] */
    #[Assert\Choice(choices: [self::PAGE_PARTICIPANTS, self::PAGE_FOLLOWS], multiple: true)]
    public array $include = [];
}
