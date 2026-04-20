<?php

namespace App\Dto;

use App\Enum\NotificationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'NotificationStatusDto')]
class NotificationStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [NotificationStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}
