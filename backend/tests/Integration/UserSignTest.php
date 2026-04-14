<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Entity\User;
use App\Entity\UserSign;
use App\Enum\UnauthorizedStatusEnum;
use PHPUnit\Framework\TestCase;

class UserSignTest extends TestCase
{
    final public function testEntityCanBeCreatedAndGettersWork(): void
    {
        $user = $this->createMock(User::class);
        $code = 654321;
        $attempt = 2;
        $status = UnauthorizedStatusEnum::Sent;
        $entity = new UserSign($user, $code, $attempt, $status);
        $this->assertInstanceOf(UserSign::class, $entity);
        $this->assertSame($user, $entity->getUser());
        $this->assertSame($code, $entity->getCode());
        $this->assertSame($attempt, $entity->getAttempt());
        $this->assertSame($status, $entity->getStatus());
    }
}

