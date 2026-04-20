<?php

namespace App\Dto;

use App\Enum\FriendStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'FriendStatusDto')]
class FriendStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [FriendStatusEnum::class, 'allowed'])]
    #[OA\Property(example: 1)]
    public int $status;
}
