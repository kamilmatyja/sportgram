<?php

namespace App\Dto;

use App\Enum\{ElementStatusEnum};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class StoryFilterDto
{
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public ?string $userId = null;

    #[Assert\Length(min: 1, max: 64)]
    #[OA\Property(example: 'Jan')]
    public ?string $text = null;

    #[Assert\Choice(callback: [ElementStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
