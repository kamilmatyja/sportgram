<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

readonly class EmailService
{
    private string $fromEmail;

    public function __construct(
        private MailerInterface $mailer,
        ParameterBagInterface $params,
    ) {
        $this->fromEmail = $params->get('MAILER_FROM');
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function send(string $to, string $title, string $text): void
    {
        $email = new Email()
            ->from($this->fromEmail)
            ->to($to)
            ->subject($title)
            ->text($text);
        $this->mailer->send($email);
    }
}
