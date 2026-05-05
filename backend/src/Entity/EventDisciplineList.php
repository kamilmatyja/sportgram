<?php

namespace App\Entity;

use App\Enum\SaveStatusEnum;
use App\Repository\EventDisciplineListRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection,Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineListRepository::class)]
#[ORM\Table(name: 'event_discipline_lists')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineList
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

    #[ORM\ManyToOne(targetEntity: EventDisciplineDistance::class, cascade: ['persist'], inversedBy: 'lists')]
    #[ORM\JoinColumn(name: 'event_discipline_distance_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDisciplineDistance $eventDisciplineDistance {
        get {
            return $this->eventDisciplineDistance;
        }
    }

    #[ORM\ManyToOne(targetEntity: Feed::class, cascade: ['persist'])]
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

    #[ORM\Column(name: 'status', type: 'integer', enumType: SaveStatusEnum::class)]
    public SaveStatusEnum $status {
        get {
            return $this->status;
        }
    }

    /** @var EventDisciplineResult[] */
    #[ORM\OneToMany(targetEntity: EventDisciplineResult::class, mappedBy: 'eventDisciplineList')]
    public Collection $results;

    public function __construct(
        EventDisciplineDistance $eventDisciplineDistance,
        Feed $feed,
        User $user,
        SaveStatusEnum $status,
    ) {
        $this->eventDisciplineDistance = $eventDisciplineDistance;
        $this->feed = $feed;
        $this->user = $user;
        $this->status = $status;
        $this->results = new ArrayCollection();
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
