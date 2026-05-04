<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'EventResultDto',
    required: ['userId', 'time'],
    properties: [
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subResults',
            type: 'array',
            items: new OA\Items(ref: '#/components/schemas/EventSubResultDto'),
            nullable: true,
        ),
    ],
    type: 'object',
)]
class EventResultDto
{
    #[Assert\NotBlank]
    #[Assert\Type('integer')]
    public int $time;

    /** @var EventSubResultDto[] */
    #[Assert\Valid]
    #[Assert\Type('array')]
    public array $subResults = [];

    final public function addSubResult(EventSubResultDto $subResult): void
    {
        $this->subResults[] = $subResult;
    }
}
