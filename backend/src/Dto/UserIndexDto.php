<?php

namespace App\Dto;

use Nelmio\ApiDocBundle\Attribute\Model;
use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    properties: [
        new OA\Property(property: 'page', type: 'integer', example: 1, nullable: true),
        new OA\Property(property: 'limit', type: 'integer', example: 10, nullable: true),
        new OA\Property(property: 'sort', type: 'string', example: 'createdAt:desc', nullable: true),
        new OA\Property(property: 'filter', ref: new Model(type: UserFilterDto::class), nullable: true),
    ],
    type: 'object',
)]
class UserIndexDto
{
    private const string SORT_FIRST_NAME_ASC = 'firstName:asc';

    private const string SORT_FIRST_NAME_DESC = 'firstName:desc';

    private const string SORT_LAST_NAME_ASC = 'lastName:asc';

    private const string SORT_LAST_NAME_DESC = 'lastName:desc';

    private const string SORT_GENDER_ASC = 'gender:asc';

    private const string SORT_GENDER_DESC = 'gender:desc';

    private const string SORT_COUNTRY_ASC = 'country:asc';

    private const string SORT_COUNTRY_DESC = 'country:desc';

    private const string SORT_BIRTH_AT_ASC = 'birthAt:asc';

    private const string SORT_BIRTH_AT_DESC = 'birthAt:desc';

    private const string SORT_STATUS_ASC = 'status:asc';

    private const string SORT_STATUS_DESC = 'status:desc';

    private const string SORT_CREATED_AT_ASC = 'createdAt:asc';

    private const string SORT_CREATED_AT_DESC = 'createdAt:desc';

    #[Assert\Positive]
    #[Assert\Range(min: 1, max: 1000)]
    public int $page = 1;

    #[Assert\Range(min: 1, max: 100)]
    public int $limit = 10;

    #[Assert\Choice(choices: [
        self::SORT_FIRST_NAME_ASC,
        self::SORT_FIRST_NAME_DESC,
        self::SORT_LAST_NAME_ASC,
        self::SORT_LAST_NAME_DESC,
        self::SORT_GENDER_ASC,
        self::SORT_GENDER_DESC,
        self::SORT_COUNTRY_ASC,
        self::SORT_COUNTRY_DESC,
        self::SORT_BIRTH_AT_ASC,
        self::SORT_BIRTH_AT_DESC,
        self::SORT_STATUS_ASC,
        self::SORT_STATUS_DESC,
        self::SORT_CREATED_AT_ASC,
        self::SORT_CREATED_AT_DESC,
    ])]
    public string $sort = self::SORT_CREATED_AT_DESC;

    #[Assert\Valid]
    public UserFilterDto $filter;

    public function __construct()
    {
        $this->filter = new UserFilterDto();
    }
}
