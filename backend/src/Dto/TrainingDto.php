<?php

namespace App\Dto;

use App\Entity\{Training, User};
use App\Validator\{EntityExistsField, UniqueField};
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['startedAt', 'endedAt', 'title', 'description', 'link', 'location'],
    properties: [
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37'),
        new OA\Property(property: 'title', type: 'string', example: 'Training Title'),
        new OA\Property(property: 'description', type: 'string', example: 'Training Description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'location', type: 'string', example: 'Training Location'),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: new Model(type: TrainingDisciplineDto::class)),
            nullable: true,
        ),
        new OA\Property(
            property: 'participants',
            type: 'array',
            items: new OA\Items(
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
            ),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class TrainingDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i')]
    public string $startedAt;

    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i')]
    public string $endedAt;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 256)]
    public string $title;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $description;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 64)]
    #[Assert\Regex(pattern: '/^[a-zA-Z0-9-]+$/')]
    #[UniqueField(entity: Training::class, field: 'link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 1024)]
    public string $location;

    /** @var TrainingDisciplineDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $disciplines = [];

    /** @var string[] */
    #[Assert\All([
        new Assert\NotBlank(),
        new Assert\Uuid(),
        new EntityExistsField(entity: User::class),
    ])]
    #[Assert\Count(min: 0)]
    #[Assert\Unique]
    public array $participants = [];

    final public function addDiscipline(TrainingDisciplineDto $discipline): void
    {
        $this->disciplines[] = $discipline;
    }
}
