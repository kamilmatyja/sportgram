<?php

namespace App\Dto;

use App\Enum\FriendStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class FriendFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $userId;

    #[Assert\Choice(callback: [FriendStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
