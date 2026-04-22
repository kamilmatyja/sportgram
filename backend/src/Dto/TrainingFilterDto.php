<?php

namespace App\Dto;

use App\Entity\User;
use App\Enum\{ElementStatusEnum};
use App\Validator\EntityExistsField;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class TrainingFilterDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[EntityExistsField(entity: User::class)]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426655440000')]
    public string $userId;

    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'Trening biegowy')]
    public ?string $title;

    #[Assert\Choice(callback: [ElementStatusEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public ?int $status = null;
}
