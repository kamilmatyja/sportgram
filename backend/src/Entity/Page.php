<?php

namespace App\Entity;

use App\Enum\{ColorEnum, ElementStatusEnum};
use App\Repository\PageRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: PageRepository::class)]
#[ORM\Table(name: 'pages')]
#[ORM\HasLifecycleCallbacks]
class Page
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

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'pages')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public User $user {
        get {
            return $this->user;
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

    #[ORM\Column(name: 'title', type: 'text', length: 256)]
    public string $title {
        get {
            return $this->title;
        }
    }

    #[ORM\Column(name: 'description', type: 'text', length: 2048)]
    public string $description {
        get {
            return $this->description;
        }
    }

    #[ORM\Column(name: 'link', type: 'text', length: 64, unique: true)]
    public string $link {
        get {
            return $this->link;
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

    #[ORM\Column(name: 'color', type: 'integer', enumType: ColorEnum::class)]
    public ColorEnum $color {
        get {
            return $this->color;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    public ElementStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var PageFollow[] */
    #[ORM\OneToMany(targetEntity: PageFollow::class, mappedBy: 'page')]
    public Collection $follows;

    /** @var PageParticipant[] */
    #[ORM\OneToMany(targetEntity: PageParticipant::class, mappedBy: 'page')]
    public Collection $participants;

    public function __construct(
        User $user,
        string $title,
        string $description,
        string $link,
        string $profilePhoto,
        string $backgroundPhoto,
        ColorEnum $color,
        ElementStatusEnum $status,
    ) {
        $this->user = $user;
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->profilePhoto = $profilePhoto;
        $this->backgroundPhoto = $backgroundPhoto;
        $this->color = $color;
        $this->status = $status;
        $this->follows = new ArrayCollection();
        $this->participants = new ArrayCollection();
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
}
