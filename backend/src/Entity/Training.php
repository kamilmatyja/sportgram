<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use App\Repository\TrainingRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TrainingRepository::class)]
#[ORM\Table(name: 'trainings')]
#[ORM\HasLifecycleCallbacks]
class Training
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

    #[ORM\OneToOne(targetEntity: Feed::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public Feed $feed {
        get {
            return $this->feed;
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

    #[ORM\Column(name: 'started_at', type: 'datetime_immutable')]
    public DateTimeImmutable $startedAt {
        get {
            return $this->startedAt;
        }
    }

    #[ORM\Column(name: 'ended_at', type: 'datetime_immutable')]
    public DateTimeImmutable $endedAt {
        get {
            return $this->endedAt;
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

    #[ORM\Column(name: 'location', type: 'text', length: 1024)]
    public string $location {
        get {
            return $this->location;
        }
    }

    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    public ElementStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var TrainingDiscipline[] */
    #[ORM\OneToMany(targetEntity: TrainingDiscipline::class, mappedBy: 'training')]
    public Collection $disciplines;

    /** @var TrainingParticipant[] */
    #[ORM\OneToMany(targetEntity: TrainingParticipant::class, mappedBy: 'training')]
    public Collection $participants;

    public function __construct(
        Feed $feed,
        User $user,
        DateTimeImmutable $startedAt,
        DateTimeImmutable $endedAt,
        string $title,
        string $description,
        string $link,
        string $location,
        ElementStatusEnum $status,
    ) {
        $this->feed = $feed;
        $this->user = $user;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->location = $location;
        $this->status = $status;
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
