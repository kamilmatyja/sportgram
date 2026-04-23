<?php

namespace App\Dto;

use App\Enum\FeedReactionEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'FeedReactionDto',
    required: ['type'],
    properties: [
        new OA\Property(property: 'type', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class FeedReactionDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [FeedReactionEnum::class, 'values'])]
    public int $type;
}
