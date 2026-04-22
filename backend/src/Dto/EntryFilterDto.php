<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\EntryTypeEnum;
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class EntryFilterDto
{
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public ?string $userId = null;

    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public ?string $entityId = null;

    #[Assert\Choice(callback: [EntryTypeEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $type = null;
}
