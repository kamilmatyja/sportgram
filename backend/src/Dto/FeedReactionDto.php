<?php

namespace App\Dto;

use App\Enum\FeedReactionEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class FeedReactionDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [FeedReactionEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $type;
}
