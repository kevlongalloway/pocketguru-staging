<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Question;
use App\Models\Option;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeders.
     *
     * @return void
     */
    public function run()
    {
        // Seed questions and options
        //ONLY FOR TESTING REMOVE IN PRODUCTION
        $this->seedQuestionsWithOptions();
    }

    /**
     * Seed questions and options.
     *
     * @return void
     */
    private function seedQuestionsWithOptions()
    {
        // Array of dummy questions with their options
        $questions = [
            [
                'question' => 'What is your favorite color?',
                'question_type' => 1,
                'options' => [
                    'Red',
                    'Blue',
                    'Green',
                    'Yellow',
                ],
            ],
            [
                'question' => 'What is your favorite animal?',
                'question_type' => 1,
                'options' => [
                    'Dog',
                    'Cat',
                    'Elephant',
                    'Lion',
                ],
            ],
            [
                'question' => 'What is your favorite animal?',
                'question_type' => 1,
                'options' => [
                    'Dog',
                    'Cat',
                    'Elephant',
                    'Lion',
                ],
            ],
            [
                'question' => 'What is your favorite animal?',
                'question_type' => 1,
                'options' => [
                    'Dog',
                    'Cat',
                    'Elephant',
                    'Lion',
                ],
            ],
            [
                'question' => 'What is your age?',
                'question_type' => 2,
                'options' => [],
            ],
        ];

        foreach ($questions as $questionData) {
            // Create the question
            $question = Question::create([
                'question' => $questionData['question'],
                'question_type' => $questionData['question_type'],
            ]);

            if ($questionData['question_type'] === 1) {
                // Create options for multiple choice questions
                foreach ($questionData['options'] as $option) {
                    Option::create([
                        'question_id' => $question->id,
                        'option' => $option,
                    ]);
                }
            }
        }
    }
}
