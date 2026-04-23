<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'FeedCommentDto',
    required: ['text'],
    properties: [
        new OA\Property(property: 'text', type: 'string', example: 'Nice post'),
    ],
    type: 'object',
)]
class FeedCommentDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $text;
}
