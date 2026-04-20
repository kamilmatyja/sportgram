<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'ConversationCreateDto')]
class ConversationCreateDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $receiverUserId;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Hello!')]
    public string $text;
}
