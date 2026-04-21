<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'PageDetailsQueryDto')]
class PageDetailsQueryDto
{
    public const string PAGE_PARTICIPANTS = 'pageParticipants';

    public const string PAGE_FOLLOWS = 'pageFollows';

    #[Assert\Choice(choices: [self::PAGE_PARTICIPANTS, self::PAGE_FOLLOWS], multiple: true)]
    #[OA\Property(description: 'Include related entities', nullable: true)]
    public array $include = [];
}
