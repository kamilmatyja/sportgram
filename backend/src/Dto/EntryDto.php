<?php

namespace App\Dto;

use App\Enum\EntryTypeEnum;
use App\Validator\EntryEntityExists;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['entityId', 'type'],
    properties: [
        new OA\Property(
            property: 'entityId',
            type: 'string',
            format: 'uuid',
            example: 'b1a7c8e2-1d2f-4e3a-9b2c-123456789abc',
        ),
        new OA\Property(property: 'type', type: 'integer', example: 1),
    ],
    type: 'object',
)]
class EntryDto
{
    #[Assert\NotBlank]
    #[Assert\Uuid]
    public ?string $entityId = null;

    #[Assert\NotBlank]
    #[Assert\Choice(callback: [EntryTypeEnum::class, 'values'])]
    public ?int $type = null;

    #[EntryEntityExists]
    final protected function getEntityValidationData(): array
    {
        return [
            'entityId' => $this->entityId,
            'type' => $this->type,
        ];
    }
}
