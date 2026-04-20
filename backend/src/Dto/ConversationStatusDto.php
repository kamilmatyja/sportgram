<?php

namespace App\Dto;

use App\Enum\ConversationStatusEnum;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'ConversationStatusDto')]
class ConversationStatusDto
{
    #[Assert\NotBlank]
    #[Assert\Choice(callback: [ConversationStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $status;
}
