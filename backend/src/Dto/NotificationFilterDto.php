<?php

namespace App\Dto;

use App\Enum\NotificationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class NotificationFilterDto
{
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'new message')]
    public ?string $text = null;

    #[Assert\Choice(callback: [NotificationStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
