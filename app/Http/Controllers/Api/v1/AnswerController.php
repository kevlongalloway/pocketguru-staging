<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AnswerController extends Controller
{
    /**
     * Store the user's answers to multiple-choice and content-based questions.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function storeUserAnswers(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'answers' => 'required',
            'answers.*.question_id' => 'required|integer',
            'answers.*.question_type' => 'required|integer',
            'answers.*.option_id' => 'nullable|required_if:answers.*.question_type,1',
            'answers.*.content' => 'nullable|required_if:answers.*.question_type,2|string',
        ]);

        $user = Auth::user();

        $answers = collect($validatedData['answers'])->map(function ($answerData) {
            $answer = new Answer([
                'question_id' => $answerData['question_id'],
            ]);

            if ($answerData['question_type'] === 1) {
                $answer->answer_type = 1;
                $answer->option_id = $answerData['option_id'];
            } elseif ($answerData['question_type'] === 2) {
                $answer->answer_type = 2;
                $answer->content = $answerData['content'];
            }

            return $answer;
        });
        $user->questionaireIsCompleted();
        $user->answers()->saveMany($answers);

        return response()->json(['success' => true]);
    }
}
