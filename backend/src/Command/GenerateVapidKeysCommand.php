<?php

namespace App\Command;

use Minishlink\WebPush\VAPID;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:generate-vapid-keys',
    description: 'Generates VAPID public and private keys for WebPush',
)]
class GenerateVapidKeysCommand extends Command
{
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $keys = VAPID::createVapidKeys();

        $io->section('backend/.env:');
        $io->writeln(sprintf('VAPID_PUBLIC_KEY=%s', $keys['publicKey']));
        $io->writeln(sprintf('VAPID_PRIVATE_KEY=%s', $keys['privateKey']));
        $io->newLine();
        $io->section('frontend/.env:');
        $io->writeln(sprintf('VITE_VAPID_PUBLIC_KEY=%s', $keys['publicKey']));

        return Command::SUCCESS;
    }
}
