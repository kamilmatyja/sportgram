<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    schema: 'PageFollowIndexDto',
    required: [],
    properties: [
        new OA\Property(property: 'page', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'limit', type: 'integer', example: 10, nullable: true),
        new OA\Property(property: 'sort', type: 'string', example: 'createdAt:desc', nullable: true),
        new OA\Property(property: 'filter', ref: '#/components/schemas/PageFollowFilterDto', nullable: true),
    ],
    type: 'object',
)]
class PageFollowIndexDto
{
    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    public int $limit = 10;

    #[Assert\Regex(pattern: '/^(status|createdAt)(:(asc|desc))?$/')]
    public string $sort = 'createdAt:desc';

    #[Assert\Valid]
    public PageFollowFilterDto $filter;

    public function __construct()
    {
        $this->filter = new PageFollowFilterDto();
    }
}
