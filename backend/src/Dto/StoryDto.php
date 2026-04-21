<?php

namespace App\Dto;

use App\Validator\{Base64String};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'StoryDto')]
class StoryDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 64)]
    #[OA\Property(example: 'Ala ma kota')]
    public string $text;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $photo;
}
