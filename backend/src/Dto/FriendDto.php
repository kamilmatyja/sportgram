<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'FriendDto')]
class FriendDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $receiverUserId;
}
