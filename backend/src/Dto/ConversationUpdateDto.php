<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'ConversationUpdateDto')]
class ConversationUpdateDto
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Hello!')]
    public string $text;
}
