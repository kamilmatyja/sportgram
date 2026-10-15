<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Service\EmailService;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBag;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\{Address, Email};

#[AllowMockObjectsWithoutExpectations]
class EmailServiceTest extends ServiceTestCase
{
    private MailerInterface&MockObject $mailer;

    private EmailService $service;

    protected function setUp(): void
    {
        $this->mailer = $this->createMock(MailerInterface::class);

        $this->service = new EmailService($this->mailer, new ParameterBag(['MAILER_FROM' => 'noreply@sportgram.test']));
    }

    final public function testSendBuildsPlainTextEmail(): void
    {
        $sent = null;
        $this->mailer->expects($this->once())
            ->method('send')
            ->willReturnCallback(static function (Email $email) use (&$sent): void {
                $sent = $email;
            });

        $this->service->send('jan@example.com', 'Your code', 'Code: 123456');

        $this->assertInstanceOf(Email::class, $sent);
        $this->assertEquals([new Address('noreply@sportgram.test')], $sent->getFrom());
        $this->assertEquals([new Address('jan@example.com')], $sent->getTo());
        $this->assertSame([], $sent->getCc());
        $this->assertSame([], $sent->getBcc());
        $this->assertSame('Your code', $sent->getSubject());
        $this->assertSame('Code: 123456', $sent->getTextBody());
        $this->assertNull($sent->getHtmlBody());
    }

    final public function testSendPropagatesTransportException(): void
    {
        $this->mailer->expects($this->once())->method('send')->willThrowException(new TransportException('SMTP down'));

        $this->expectException(TransportException::class);
        $this->expectExceptionMessage('SMTP down');

        $this->service->send('jan@example.com', 'Subject', 'Text');
    }
}
