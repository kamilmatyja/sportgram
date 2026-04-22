<?php

namespace App\Entity;

use App\Repository\TrainingDisciplineDistanceRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: TrainingDisciplineDistanceRepository::class)]
#[ORM\Table(name: 'training_discipline_distances')]
#[ORM\HasLifecycleCallbacks]
class TrainingDisciplineDistance
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

    #[ORM\ManyToOne(targetEntity: TrainingDiscipline::class, inversedBy: 'distances')]
    #[ORM\JoinColumn(name: 'training_discipline_id', referencedColumnName: 'id', nullable: false)]
    public TrainingDiscipline $trainingDiscipline {
        get {
            return $this->trainingDiscipline;
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

    #[ORM\Column(name: 'distance', type: 'integer')]
    public int $distance {
        get {
            return $this->distance;
        }
    }

    #[ORM\Column(name: 'time', type: 'integer')]
    public int $time {
        get {
            return $this->time;
        }
    }

    #[ORM\OneToMany(targetEntity: TrainingDisciplineSubDistance::class, mappedBy: 'trainingDisciplineDistance')]
    public Collection $subDistances;

    public function __construct(TrainingDiscipline $trainingDiscipline, int $distance, int $time)
    {
        $this->trainingDiscipline = $trainingDiscipline;
        $this->distance = $distance;
        $this->time = $time;
        $this->subDistances = new ArrayCollection();
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
