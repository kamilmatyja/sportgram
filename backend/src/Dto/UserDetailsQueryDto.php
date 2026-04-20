<?php

namespace App\Dto;

use OpenApi\Attributes as OA;
use Symfony\Component\Validator\Constraints as Assert;

#[OA\Schema(schema: 'UserDetailsQueryDto')]
class UserDetailsQueryDto
{
    public const string USER_DISCIPLINES = 'userDisciplines';

    #[Assert\Choice(choices: [self::USER_DISCIPLINES])]
    #[OA\Property(description: 'Include related entities', example: self::USER_DISCIPLINES)]
    public ?string $include = null;
}
