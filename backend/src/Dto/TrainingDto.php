<?php

namespace App\Dto;

use App\Entity\{Training, User};
use App\Validator\{EntityExistsField, UniqueField};
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'TrainingDto')]
class TrainingDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
    #[OA\Property(example: '2026-04-22T10:00:00')]
    public string $startedAt;

    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
    #[OA\Property(example: '2026-04-22T12:00:00')]
    public string $endedAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 256)]
    #[OA\Property(example: 'Morning Run')]
    public string $title;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    #[OA\Property(example: 'A nice training session.')]
    public string $description;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Training::class, field: 'link')]
    #[OA\Property(example: 'morning-run')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 1024)]
    #[OA\Property(example: 'Central Park')]
    public ?string $location = null;

    /** @var TrainingDisciplineDto[] */
    #[Assert\Valid]
    #[OA\Property(type: 'array', items: new OA\Items(ref: '#/components/schemas/TrainingDisciplineDto'))]
    public array $disciplines = [];

    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 1)]
    #[Assert\Unique]
    #[OA\Property(example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000'])]
    public array $participants = [];
}
