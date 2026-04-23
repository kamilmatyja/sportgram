<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'GoalIndexDto',
    required: [],
    properties: [
        new OA\Property(property: 'page', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'limit', type: 'integer', example: 10, nullable: true),
        new OA\Property(property: 'sort', type: 'string', example: 'createdAt:desc', nullable: true),
        new OA\Property(property: 'filter', ref: '#/components/schemas/GoalFilterDto', nullable: true),
    ],
    type: 'object',
)]
class GoalIndexDto
{
    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    public int $limit = 10;

    #[Assert\Regex(pattern: '/^(text|discipline|distance|time|status|createdAt|startedAt|endedAt)(:(asc|desc))?$/')]
    public string $sort = 'createdAt:desc';

    #[Assert\Valid]
    public GoalFilterDto $filter;

    public function __construct()
    {
        $this->filter = new GoalFilterDto();
    }
}
