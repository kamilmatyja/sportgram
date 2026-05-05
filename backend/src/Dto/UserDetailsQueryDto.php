<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(
    required: [],
    properties: [
        new OA\Property(property: 'include', type: 'array', example: [self::USER_DISCIPLINES], nullable: true),
    ],
    type: 'object',
)]
class UserDetailsQueryDto
{
    public const string USER_DISCIPLINES = 'userDisciplines';

    public const string USER_ROLES = 'userRoles';

    /** @var string[] */
    #[Assert\Choice(choices: [self::USER_DISCIPLINES, self::USER_ROLES], multiple: true)]
    public array $include = [];
}
