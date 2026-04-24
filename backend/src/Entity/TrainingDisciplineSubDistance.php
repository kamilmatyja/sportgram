<?php

namespace App\Entity;

use App\Repository\TrainingDisciplineSubDistanceRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TrainingDisciplineSubDistanceRepository::class)]
#[ORM\Table(name: 'training_discipline_sub_distances')]
#[ORM\HasLifecycleCallbacks]
class TrainingDisciplineSubDistance
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

    #[ORM\ManyToOne(targetEntity: TrainingDisciplineDistance::class, inversedBy: 'subDistances')]
    #[ORM\JoinColumn(name: 'training_discipline_distance_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public TrainingDisciplineDistance $trainingDisciplineDistance {
        get {
            return $this->trainingDisciplineDistance;
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

    #[ORM\Column(name: 'sub_distance', type: 'integer')]
    public int $subDistance {
        get {
            return $this->subDistance;
        }
    }

    #[ORM\Column(name: 'time', type: 'integer')]
    public int $time {
        get {
            return $this->time;
        }
    }

    #[ORM\Column(name: 'lat', type: 'integer', nullable: true)]
    public ?int $lat = null {
        get {
            return $this->lat;
        }
    }

    #[ORM\Column(name: 'lng', type: 'integer', nullable: true)]
    public ?int $lng = null {
        get {
            return $this->lng;
        }
    }

    #[ORM\Column(name: 'accuracy', type: 'integer', nullable: true)]
    public ?int $accuracy = null {
        get {
            return $this->accuracy;
        }
    }

    #[ORM\Column(name: 'speed', type: 'integer', nullable: true)]
    public ?int $speed = null {
        get {
            return $this->speed;
        }
    }

    public function __construct(
        TrainingDisciplineDistance $trainingDisciplineDistance,
        int $subDistance,
        int $time,
        ?int $lat,
        ?int $lng,
        ?int $accuracy,
        ?int $speed,
    ) {
        $this->trainingDisciplineDistance = $trainingDisciplineDistance;
        $this->subDistance = $subDistance;
        $this->time = $time;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->accuracy = $accuracy;
        $this->speed = $speed;
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
