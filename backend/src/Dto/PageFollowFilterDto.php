<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\PageFollowStatusEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class PageFollowFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $userId;

    #[Assert\Choice(callback: [PageFollowStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
