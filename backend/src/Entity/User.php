<?php

namespace App\Entity;

use App\Enum\{ColorEnum, CountryEnum, GenderEnum, LanguageEnum, ThemeEnum, UserStatusEnum};
use App\Repository\UserRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\{Mapping as ORM};
use Symfony\Component\Security\Core\User\{PasswordAuthenticatedUserInterface, UserInterface};
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    public ?Uuid $id = null {
        get {
            return $this->id;
        }
    }

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    public DateTimeImmutable $createdAt {
        get {
            return $this->createdAt;
        }
    }

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    public DateTimeImmutable $updatedAt {
        get {
            return $this->updatedAt;
        }
    }

    #[ORM\Column(name: 'birth_at', type: 'datetime_immutable')]
    public DateTimeImmutable $birthAt {
        get {
            return $this->birthAt;
        }
    }

    #[ORM\Column(name: 'first_name', type: 'text', length: 64)]
    public string $firstName {
        get {
            return $this->firstName;
        }
    }

    #[ORM\Column(name: 'last_name', type: 'text', length: 64)]
    public string $lastName {
        get {
            return $this->lastName;
        }
    }

    #[ORM\Column(name: 'gender', type: 'integer', enumType: GenderEnum::class)]
    public GenderEnum $gender {
        get {
            return $this->gender;
        }
    }

    #[ORM\Column(name: 'phone', type: 'integer', length: 16, unique: true)]
    public int $phone {
        get {
            return $this->phone;
        }
    }

    #[ORM\Column(name: 'email', type: 'text', length: 64, unique: true)]
    public string $email {
        get {
            return $this->email;
        }
    }

    #[ORM\Column(name: 'password', type: 'text', length: 256)]
    public string $password {
        get {
            return $this->password;
        }
        set {
            $this->password = $value;
        }
    }

    #[ORM\Column(name: 'link', type: 'text', length: 64)]
    public string $link {
        get {
            return $this->link;
        }
    }

    #[ORM\Column(name: 'language', type: 'integer', enumType: LanguageEnum::class)]
    public LanguageEnum $language {
        get {
            return $this->language;
        }
    }

    #[ORM\Column(name: 'country', type: 'integer', enumType: CountryEnum::class)]
    public CountryEnum $country {
        get {
            return $this->country;
        }
    }

    #[ORM\Column(name: 'theme', type: 'integer', enumType: ThemeEnum::class)]
    public ThemeEnum $theme {
        get {
            return $this->theme;
        }
    }

    #[ORM\Column(name: 'color', type: 'integer', enumType: ColorEnum::class)]
    public ColorEnum $color {
        get {
            return $this->color;
        }
    }

    #[ORM\Column(name: 'profile_photo', type: 'binary')]
    public string $profilePhoto {
        get {
            return $this->profilePhoto;
        }
    }

    #[ORM\Column(name: 'background_photo', type: 'binary')]
    public string $backgroundPhoto {
        get {
            return $this->backgroundPhoto;
        }
    }

    #[ORM\Column(name: 'bio', type: 'text', length: 2048)]
    public string $bio {
        get {
            return $this->bio;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: UserStatusEnum::class)]
    public UserStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var UserRole[] */
    #[ORM\OneToMany(targetEntity: UserRole::class, mappedBy: 'user')]
    public Collection $roles;

    /** @var UserDiscipline[] */
    #[ORM\OneToMany(targetEntity: UserDiscipline::class, mappedBy: 'user')]
    public Collection $disciplines;

    /** @var Page[] */
    #[ORM\OneToMany(targetEntity: Page::class, mappedBy: 'user')]
    public Collection $pages;

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
        $this->disciplines = new ArrayCollection();
        $this->pages = new ArrayCollection();
    }

    #[ORM\PrePersist]
    final public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    final public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    final public function getUserIdentifier(): string
    {
        return $this->email;
    }

    final public function getPassword(): string
    {
        return $this->password;
    }

    final public function getRoles(): array
    {
        return array_map(
            fn (UserRole $role) => $role->role->getLabel(),
            $this->roles->toArray(),
        );
    }
}
