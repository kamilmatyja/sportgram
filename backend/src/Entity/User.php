<?php

namespace App\Entity;

use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, ThemeEnum, UserStatusEnum};
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\{PasswordAuthenticatedUserInterface, UserInterface};
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'birth_at', type: 'datetime_immutable')]
    private DateTimeImmutable $birthAt;
    #[ORM\Column(name: 'first_name', type: 'text', length: 64)]
    private string $firstName;
    #[ORM\Column(name: 'last_name', type: 'text', length: 64)]
    private string $lastName;
    #[ORM\Column(name: 'gender', type: 'integer', enumType: GenderEnum::class)]
    private GenderEnum $gender;
    #[ORM\Column(name: 'phone', type: 'integer', length: 16, unique: true)]
    private int $phone;
    #[ORM\Column(name: 'email', type: 'text', length: 64, unique: true)]
    private string $email;
    #[ORM\Column(name: 'password', type: 'text', length: 256)]
    private string $password;
    #[ORM\Column(name: 'link', type: 'text', length: 64)]
    private string $link;
    #[ORM\Column(name: 'language', type: 'integer', enumType: LanguageEnum::class)]
    private LanguageEnum $language;
    #[ORM\Column(name: 'country', type: 'integer', enumType: CountryEnum::class)]
    private CountryEnum $country;
    #[ORM\Column(name: 'theme', type: 'integer', enumType: ThemeEnum::class)]
    private ThemeEnum $theme;
    #[ORM\Column(name: 'color', type: 'integer', enumType: ColorEnum::class)]
    private ColorEnum $color;
    #[ORM\Column(name: 'profile_photo', type: 'binary')]
    private string $profilePhoto;
    #[ORM\Column(name: 'background_photo', type: 'binary')]
    private string $backgroundPhoto;
    #[ORM\Column(name: 'bio', type: 'text', length: 2048)]
    private string $bio;
    #[ORM\Column(name: 'status', type: 'integer', enumType: UserStatusEnum::class)]
    private UserStatusEnum $status;
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserRole::class)]
    private $roles;

    public function __construct(
        DateTimeImmutable $birthAt,
        string $firstName,
        string $lastName,
        GenderEnum $gender,
        int $phone,
        string $email,
        string $link,
        LanguageEnum $language,
        CountryEnum $country,
        ThemeEnum $theme,
        ColorEnum $color,
        string $profilePhoto,
        string $backgroundPhoto,
        string $bio,
        UserStatusEnum $status,
    ) {
        $this->birthAt = $birthAt;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->gender = $gender;
        $this->phone = $phone;
        $this->email = $email;
        $this->link = $link;
        $this->language = $language;
        $this->country = $country;
        $this->theme = $theme;
        $this->color = $color;
        $this->profilePhoto = $profilePhoto;
        $this->backgroundPhoto = $backgroundPhoto;
        $this->bio = $bio;
        $this->status = $status;
        $this->roles = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getUserIdentifier(): string
    {
        return $this->id->toString();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function getBirthAt(): DateTimeImmutable
    {
        return $this->birthAt;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function getGender(): GenderEnum
    {
        return $this->gender;
    }

    public function getPhone(): int
    {
        return $this->phone;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setPassword(string $password): void
    {
        $this->password = $password;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function getLink(): string
    {
        return $this->link;
    }

    public function getLanguage(): LanguageEnum
    {
        return $this->language;
    }

    public function getCountry(): CountryEnum
    {
        return $this->country;
    }

    public function getTheme(): ThemeEnum
    {
        return $this->theme;
    }

    public function getColor(): ColorEnum
    {
        return $this->color;
    }

    public function getProfilePhoto(): string
    {
        return $this->profilePhoto;
    }

    public function getBackgroundPhoto(): string
    {
        return $this->backgroundPhoto;
    }

    public function getBio(): string
    {
        return $this->bio;
    }

    public function getStatus(): UserStatusEnum
    {
        return $this->status;
    }

    public function getRoles(): array
    {
        return $this->roles->toArray();
    }
}
