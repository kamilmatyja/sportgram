<?php

namespace App\Entity;

use App\Repository\EventDisciplineResultRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineResultRepository::class)]
#[ORM\Table(name: 'event_discipline_results')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineResult
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

    #[ORM\ManyToOne(targetEntity: EventDisciplineList::class, cascade: ['persist'], inversedBy: 'results')]
    #[ORM\JoinColumn(name: 'event_discipline_list_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDisciplineList $eventDisciplineList {
        get {
            return $this->eventDisciplineList;
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

    #[ORM\Column(name: 'time', type: 'integer')]
    public int $time {
        get {
            return $this->time;
        }
    }

    /** @var EventDisciplineSubResult[] */
    #[ORM\OneToMany(targetEntity: EventDisciplineSubResult::class, mappedBy: 'eventDisciplineResult')]
    public Collection $subResults;

    public function __construct(EventDisciplineList $eventDisciplineList, Feed $feed, User $user, int $time)
    {
        $this->eventDisciplineList = $eventDisciplineList;
        $this->feed = $feed;
        $this->user = $user;
        $this->time = $time;
        $this->subResults = new ArrayCollection();
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
