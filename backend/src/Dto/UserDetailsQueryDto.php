<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'UserDetailsQueryDto')]
class UserDetailsQueryDto
{
    public const string USER_DISCIPLINES = 'userDisciplines';

    public const string USER_ROLES = 'userRoles';

    #[Assert\Choice(choices: [self::USER_DISCIPLINES, self::USER_ROLES], multiple: true)]
    #[OA\Property(description: 'Include related entities', nullable: true)]
    public array $include = [];
}
