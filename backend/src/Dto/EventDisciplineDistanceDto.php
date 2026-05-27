<?php

namespace App\Dto;

use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['distance'],
    properties: [
        new OA\Property(property: 'distance', type: 'integer', example: 100),
        new OA\Property(
            property: 'subDistances',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventDisciplineSubDistanceDto::class)),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventDisciplineDistanceDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $distance;

    /** @var EventDisciplineSubDistanceDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $subDistances = [];

    final public function addSubDistance(EventDisciplineSubDistanceDto $subDistance): void
    {
        $this->subDistances[] = $subDistance;
    }
}
