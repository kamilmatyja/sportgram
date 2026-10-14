<?php

namespace App\Dto;

use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'page', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'limit', type: 'integer', example: 10, nullable: true),
        new OA\Property(property: 'sort', type: 'string', example: 'createdAt:desc', nullable: true),
        new OA\Property(property: 'filter', ref: new Model(type: EntryFilterDto::class), nullable: true),
    ],
    type: 'object',
)]
class EntryIndexDto
{
    private const string SORT_TYPE_ASC = 'type:asc';

    private const string SORT_TYPE_DESC = 'type:desc';

    private const string SORT_CREATED_AT_ASC = 'createdAt:asc';

    private const string SORT_CREATED_AT_DESC = 'createdAt:desc';

    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    public int $limit = 10;

    #[Assert\Choice(choices: [
        self::SORT_TYPE_ASC,
        self::SORT_TYPE_DESC,
        self::SORT_CREATED_AT_ASC,
        self::SORT_CREATED_AT_DESC,
    ])]
    public string $sort = self::SORT_CREATED_AT_DESC;

    #[Assert\Valid]
    public EntryFilterDto $filter;

    public function __construct()
    {
        $this->filter = new EntryFilterDto();
    }
}
