<?php

namespace App\Dto;

use App\Enum\FriendStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['status'],
    properties: [
        new OA\Property(property: 'status', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class FriendStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [FriendStatusEnum::class, 'allowed'])]
    public int $status;
}
