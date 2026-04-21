<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class FeedCommentDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Komentarz do wpisu')]
    public string $text;
}
