<?php

namespace App\Dto;

use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: ['userId', 'time'],
    properties: [
        new OA\Property(property: 'time', type: 'integer', example: 60),
        new OA\Property(
            property: 'subResults',
            type: 'array',
            items: new OA\Items(ref: new Model(type: EventSubResultDto::class)),
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
