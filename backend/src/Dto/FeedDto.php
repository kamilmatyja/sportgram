<?php

namespace App\Dto;

use App\Validator\Base64String;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class FeedDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Nowy wpis')]
    public string $text;

    #[Assert\NotBlank]
    #[Base64String]
    #[OA\Property(example: 'base64string')]
    public string $photo;
}
