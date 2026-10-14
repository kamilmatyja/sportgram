<?php

namespace App\Command;

use Minishlink\WebPush\VAPID;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'app:generate-vapid-keys',
    description: 'Generates VAPID keys and updates backend and frontend .env files',
)]
class GenerateVapidKeysCommand extends Command
{
    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $keys = VAPID::createVapidKeys();

        $backendEnvPath = $this->projectDir . '/.env';
        $frontendEnvPath = dirname($this->projectDir) . '/frontend/.env';

        $this->updateEnvFile($backendEnvPath, [
            'VAPID_PUBLIC_KEY' => $keys['publicKey'],
            'VAPID_PRIVATE_KEY' => $keys['privateKey'],
        ], $io);

        $this->updateEnvFile($frontendEnvPath, [
            'VITE_VAPID_PUBLIC_KEY' => $keys['publicKey'],
        ], $io);

        $io->success('VAPID keys generated and applied successfully.');

        return Command::SUCCESS;
    }

    /**
     * @param array<string, string> $variables
     */
    private function updateEnvFile(string $filePath, array $variables, SymfonyStyle $io): void
    {
        if (! file_exists($filePath)) {
            $io->warning(sprintf('File %s not found. Skipping automatic update.', $filePath));

            return;
        }

        $content = file_get_contents($filePath);

        foreach ($variables as $key => $value) {
            $pattern = sprintf('/^%s=.*/m', preg_quote($key, '/'));
            $newLine = sprintf('%s=%s', $key, $value);

            if (preg_match($pattern, $content)) {
                $content = preg_replace($pattern, $newLine, $content);
            } else {
                $content .= (str_ends_with($content, "\n") ? '' : "\n") . $newLine . "\n";
            }
        }

        file_put_contents($filePath, $content);
        $io->info(sprintf('Updated %s', $filePath));
    }
}
