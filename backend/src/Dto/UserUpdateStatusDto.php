<?php

namespace App\Dto;

use App\Enum\UserStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'UserUpdateStatusDto')]
class UserUpdateStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [UserStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}
