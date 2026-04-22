<?php

namespace App\Dto;

use App\Entity\User;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'FriendDto')]
class FriendDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $receiverUserId;
}
