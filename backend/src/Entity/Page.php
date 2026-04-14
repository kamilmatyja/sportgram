<?php

namespace App\Entity;

use App\Enum\ColorEnum;
use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'pages')]
#[ORM\HasLifecycleCallbacks]
class Page
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'title', type: 'text', length: 256)]
    private string $title;
    #[ORM\Column(name: 'description', type: 'text', length: 2048)]
    private string $description;
    #[ORM\Column(name: 'link', type: 'text', length: 64, unique: true)]
    private string $link;
    #[ORM\Column(name: 'profile_photo', type: 'binary')]
    private string $profilePhoto;
    #[ORM\Column(name: 'background_photo', type: 'binary')]
    private string $backgroundPhoto;
    #[ORM\Column(name: 'color', type: 'integer', enumType: ColorEnum::class)]
    private ColorEnum $color;
    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    private ElementStatusEnum $status;

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

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
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

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getLink(): string
    {
        return $this->link;
    }

    public function getProfilePhoto(): string
    {
        return $this->profilePhoto;
    }

    public function getBackgroundPhoto(): string
    {
        return $this->backgroundPhoto;
    }

    public function getColor(): ColorEnum
    {
        return $this->color;
    }

    public function getStatus(): ElementStatusEnum
    {
        return $this->status;
    }
}
