<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'events')]
#[ORM\HasLifecycleCallbacks]
class Event
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

    #[ORM\ManyToOne(targetEntity: PageParticipant::class)]
    #[ORM\JoinColumn(name: 'page_participant_id', referencedColumnName: 'id', nullable: false)]
    public PageParticipant $pageParticipant {
        get {
            return $this->pageParticipant;
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

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null {
        get {
            return $this->deletedAt;
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

    #[ORM\Column(name: 'rules', type: 'text', length: 2048)]
    public string $rules {
        get {
            return $this->rules;
        }
    }

    #[ORM\Column(name: 'photo', type: 'binary')]
    public string $photo {
        get {
            return $this->photo;
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

    public function __construct(
        PageParticipant $pageParticipant,
        DateTimeImmutable $startedAt,
        DateTimeImmutable $endedAt,
        string $title,
        string $description,
        string $link,
        string $rules,
        string $photo,
        string $location,
        ElementStatusEnum $status,
    ) {
        $this->pageParticipant = $pageParticipant;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->rules = $rules;
        $this->photo = $photo;
        $this->location = $location;
        $this->status = $status;
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

    final public function softDelete(): void
    {
        $this->deletedAt = new DateTimeImmutable();
    }

    final public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }
}
