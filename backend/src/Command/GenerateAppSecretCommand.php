<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

#[AsCommand(
    name: 'app:generate-app-secret',
    description: 'Generates a new APP_SECRET and updates the backend .env file',
)]
class GenerateAppSecretCommand extends Command
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

        $secret = bin2hex(random_bytes(16));

        $backendEnvPath = $this->projectDir . '/.env';

        $this->updateEnvFile($backendEnvPath, [
            'APP_SECRET' => $secret,
        ], $io);

        $io->success('APP_SECRET generated and applied successfully.');

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
