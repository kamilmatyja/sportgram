<?php

namespace App\Dto;

use App\Enum\ConversationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class ConversationFilterDto
{
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public ?string $userId = null;

    #[Assert\Choice(callback: [ConversationStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
