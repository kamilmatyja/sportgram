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
        new OA\Property(property: 'filter', ref: new Model(type: EventFilterDto::class), nullable: true),
    ],
    type: 'object',
)]
class EventIndexDto
{
    private const string SORT_TITLE_ASC = 'title:asc';

    private const string SORT_TITLE_DESC = 'title:desc';

    private const string SORT_LOCATION_ASC = 'location:asc';

    private const string SORT_LOCATION_DESC = 'location:desc';

    private const string SORT_STATUS_ASC = 'status:asc';

    private const string SORT_STATUS_DESC = 'status:desc';

    private const string SORT_CREATED_AT_ASC = 'createdAt:asc';

    private const string SORT_CREATED_AT_DESC = 'createdAt:desc';

    private const string SORT_STARTED_AT_ASC = 'startedAt:asc';

    private const string SORT_STARTED_AT_DESC = 'startedAt:desc';

    private const string SORT_ENDED_AT_ASC = 'endedAt:asc';

    private const string SORT_ENDED_AT_DESC = 'endedAt:desc';

    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    public int $limit = 10;

    #[Assert\Choice(choices: [
        self::SORT_TITLE_ASC,
        self::SORT_TITLE_DESC,
        self::SORT_LOCATION_ASC,
        self::SORT_LOCATION_DESC,
        self::SORT_STATUS_ASC,
        self::SORT_STATUS_DESC,
        self::SORT_CREATED_AT_ASC,
        self::SORT_CREATED_AT_DESC,
        self::SORT_STARTED_AT_ASC,
        self::SORT_STARTED_AT_DESC,
        self::SORT_ENDED_AT_ASC,
        self::SORT_ENDED_AT_DESC,
    ])]
    public string $sort = self::SORT_CREATED_AT_DESC;

    #[Assert\Valid]
    public EventFilterDto $filter;

    public function __construct()
    {
        $this->filter = new EventFilterDto();
    }
}
