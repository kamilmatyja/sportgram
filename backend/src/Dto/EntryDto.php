<?php

namespace App\Dto;

use App\Enum\EntryTypeEnum;
use App\Validator\EntryEntityExists;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

class EntryDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    #[OA\Property(example: '123e4567-e89b-12d3-a456-426614174000')]
    public string $entityId;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [EntryTypeEnum::class, 'values'])]
    #[OA\Property(example: 1)]
    public int $type;

    #[EntryEntityExists]
    protected function getEntityValidationData(): array
    {
        return [
            'entityId' => $this->entityId,
            'type' => $this->type,
        ];
    }
}
