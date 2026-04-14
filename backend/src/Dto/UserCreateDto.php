<?php

namespace App\Dto;

class UserCreateDto
{
    public string $birthAt;
    public string $firstName;
    public string $lastName;
    public int $gender;
    public string $phone;
    public string $email;
    public string $password;
    public string $link;
    public int $language;
    public int $country;
    public int $theme;
    public int $color;
    public string $profilePhoto;
    public string $backgroundPhoto;
    public string $bio;
    public array $roles;
}
