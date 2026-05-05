<?php

namespace App\Dto;

use App\Entity\Event;
use App\Validator\UniqueField;
use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['startedAt', 'endedAt', 'title', 'description', 'link', 'rules', 'photo', 'location'],
    properties: [
        new OA\Property(property: 'startedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'endedAt', type: 'string', format: 'date-time', example: '2000-01-01T21:37:00'),
        new OA\Property(property: 'title', type: 'string', example: 'Event Title'),
        new OA\Property(property: 'description', type: 'string', example: 'Event Description'),
        new OA\Property(property: 'link', type: 'string', example: 'my-link'),
        new OA\Property(property: 'rules', type: 'string', example: 'Event Rules'),
        new OA\Property(property: 'photo', type: 'string', example: 'base64string'),
        new OA\Property(property: 'location', type: 'string', example: 'Event Location'),
        new OA\Property(
            property: 'disciplines',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventDisciplineDto::class)),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventDto
{
    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
    public string $startedAt;

    #[Assert\NotBlank]
    #[Assert\DateTime(format: 'Y-m-d\TH:i:s')]
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
    #[UniqueField(entity: Event::class, field: 'link')]
    public string $link;

    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 2048)]
    public string $rules;

    #[Assert\NotBlank]
    public string $photo;

    #[Assert\NotBlank]
    #[Assert\Length(min: 5, max: 1024)]
    public string $location;

    /** @var EventDisciplineDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $disciplines = [];

    final public function addDiscipline(EventDisciplineDto $discipline): void
    {
        $this->disciplines[] = $discipline;
    }
}
