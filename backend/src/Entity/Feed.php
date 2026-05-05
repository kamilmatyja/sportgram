<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use App\Repository\FeedRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: FeedRepository::class)]
#[ORM\Table(name: 'feeds')]
#[ORM\HasLifecycleCallbacks]
class Feed
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

    #[ORM\ManyToOne(targetEntity: User::class, cascade: ['persist'])]
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

    #[ORM\Column(name: 'text', type: 'text', length: 2048, nullable: true)]
    public ?string $text = null {
        get {
            return $this->text;
        }
    }

    #[ORM\Column(name: 'photo', type: 'binary', nullable: true)]
    public ?string $photo = null {
        get {
            return $this->photo;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    public ElementStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var FeedComment[] */
    #[ORM\OneToMany(targetEntity: FeedComment::class, mappedBy: 'feed')]
    public Collection $comments;

    /** @var FeedReaction[] */
    #[ORM\OneToMany(targetEntity: FeedReaction::class, mappedBy: 'feed')]
    public Collection $reactions;

    public function __construct(User $user, ?string $text, ?string $photo, ElementStatusEnum $status)
    {
        $this->user = $user;
        $this->text = $text;
        $this->photo = $photo;
        $this->status = $status;
        $this->comments = new ArrayCollection();
        $this->reactions = new ArrayCollection();
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
