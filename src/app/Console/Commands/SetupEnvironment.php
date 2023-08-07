<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetupEnvironment extends Command {
	protected $signature = 'setup:env';

	protected $description = 'Set up Laravel application environment variables';

	public function handle() {
		$this->copyEnvFileIFNotExists();

		$envVars = ['APP_URL', 'APP_ENV', 'APP_DEBUG', 'DB_CONNECTION', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'TTS_PARENT_FORMAT', 'TTS_PROJECT', 'TTS_LOCATION'];

		foreach ($envVars as $envVar) {
			if (!$this->isEnvSet($envVar)) {
				$value = $this->ask("Please enter the value for $envVar:");
				$this->updateEnvironmentFile($envVar, $value);
			}
		}

		$this->info("Environment variables set successfully!");
	}

	private function copyEnvFileIFNotExists() {
		$envFile = base_path('.env');
		if (!file_exists($envFile)) {
			copy(base_path('.env.example'), $envFile);
		}
	}

	private function isEnvSet($key) {
		$envFile = base_path('.env');
		$contents = file_get_contents($envFile);
		return strpos($contents, "$key=");
	}

	private function updateEnvironmentFile($key, $value) {
		$envFile = base_path('.env');
		$contents = file_get_contents($envFile);

		// Check if the variable already exists in the .env file
		if (strpos($contents, "$key=") !== false) {
			// Update the existing value
			$contents = preg_replace("/{$key}=.*/", "{$key}={$value}", $contents);
		} else {
			// Append the new variable at the end of the file
			$contents .= "{$key}={$value}" . PHP_EOL;
		}

		file_put_contents($envFile, $contents);
	}
}
