<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\FriendStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class FeedFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public ?string $userId = null;

    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Ala ma kota')]
    public ?string $text = null;

    #[Assert\Choice(callback: [FriendStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
