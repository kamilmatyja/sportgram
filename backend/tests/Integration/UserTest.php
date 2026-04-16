<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\User;
use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, ThemeEnum, UserStatusEnum};
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $birthAt = new DateTimeImmutable('2000-01-01');
        $firstName = 'Jan';
        $lastName = 'Kowalski';
        $gender = GenderEnum::Male;
        $phone = 123456789;
        $email = 'user@example.com';
        $link = 'user-link';
        $language = LanguageEnum::Polish;
        $country = CountryEnum::Poland;
        $theme = ThemeEnum::Light;
        $color = ColorEnum::Blue;
        $profilePhoto = 'profile';
        $backgroundPhoto = 'background';
        $bio = 'bio';
        $status = UserStatusEnum::Accepted;
        $entity = new User(
            $birthAt,
            $firstName,
            $lastName,
            $gender,
            $phone,
            $email,
            $link,
            $language,
            $country,
            $theme,
            $color,
            $profilePhoto,
            $backgroundPhoto,
            $bio,
            $status,
        );
        $this->assertInstanceOf(User::class, $entity);
        $this->assertSame($birthAt, $entity->birthAt);
        $this->assertSame($firstName, $entity->firstName);
        $this->assertSame($lastName, $entity->lastName);
        $this->assertSame($gender, $entity->gender);
        $this->assertSame($phone, $entity->phone);
        $this->assertSame($email, $entity->email);
        $this->assertSame($link, $entity->link);
        $this->assertSame($language, $entity->language);
        $this->assertSame($country, $entity->country);
        $this->assertSame($theme, $entity->theme);
        $this->assertSame($color, $entity->color);
        $this->assertSame($profilePhoto, $entity->profilePhoto);
        $this->assertSame($backgroundPhoto, $entity->backgroundPhoto);
        $this->assertSame($bio, $entity->bio);
        $this->assertSame($status, $entity->status);
    }
}
