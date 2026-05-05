<?php

namespace App\Dto;

use App\Validator\Base64String;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['text', 'photo'],
    properties: [
        new OA\Property(property: 'text', type: 'string', example: 'New post'),
        new OA\Property(property: 'photo', type: 'string', example: 'base64string'),
    ],
    type: 'object',
)]
class FeedDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $text;

    #[Assert\NotBlank]
    #[Base64String]
    public string $photo;
}
