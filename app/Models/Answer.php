<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    use HasFactory;


    /**
     * Get the user associated with the answer.
     *
     * This function defines a many-to-one relationship between the Answer model
     * and the User model. It returns the User model instance that is associated
     * with the answer.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
    */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
