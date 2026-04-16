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
        $this->assertSame($birthAt, $entity->getBirthAt());
        $this->assertSame($firstName, $entity->getFirstName());
        $this->assertSame($lastName, $entity->getLastName());
        $this->assertSame($gender, $entity->getGender());
        $this->assertSame($phone, $entity->getPhone());
        $this->assertSame($email, $entity->getEmail());
        $this->assertSame($link, $entity->getLink());
        $this->assertSame($language, $entity->getLanguage());
        $this->assertSame($country, $entity->getCountry());
        $this->assertSame($theme, $entity->getTheme());
        $this->assertSame($color, $entity->getColor());
        $this->assertSame($profilePhoto, $entity->getProfilePhoto());
        $this->assertSame($backgroundPhoto, $entity->getBackgroundPhoto());
        $this->assertSame($bio, $entity->getBio());
        $this->assertSame($status, $entity->getStatus());
    }
}
