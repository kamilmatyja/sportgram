<?php

namespace App\Entity;

use App\Enum\DisciplineEnum;
use App\Enum\GoalStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'goals')]
#[ORM\HasLifecycleCallbacks]
class Goal
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: Feed::class)]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false)]
    private Feed $feed;
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'started_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $startedAt = null;
    #[ORM\Column(name: 'ended_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $endedAt = null;
    #[ORM\Column(name: 'text', type: 'text', length: 4096)]
    private string $text;
    #[ORM\Column(name: 'link', type: 'text', length: 64)]
    private string $link;
    #[ORM\Column(name: 'discipline', type: 'integer', enumType: DisciplineEnum::class)]
    private DisciplineEnum $discipline;
    #[ORM\Column(name: 'distance', type: 'integer')]
    private int $distance;
    #[ORM\Column(name: 'time', type: 'integer', nullable: true)]
    private ?int $time = null;
    #[ORM\Column(name: 'status', type: 'integer', enumType: GoalStatusEnum::class)]
    private GoalStatusEnum $status;

    public function __construct(
        Feed $feed,
        User $user,
        ?DateTimeImmutable $startedAt,
        ?DateTimeImmutable $endedAt,
        string $text,
        string $link,
        DisciplineEnum $discipline,
        int $distance,
        ?int $time,
        GoalStatusEnum $status,
    ) {
        $this->feed = $feed;
        $this->user = $user;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->text = $text;
        $this->link = $link;
        $this->discipline = $discipline;
        $this->distance = $distance;
        $this->time = $time;
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
}
