<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the answers associated with the user.
     *
     * This function defines a one-to-many relationship between the User model
     * and the Answer model. It returns a collection of Answer models that
     * are associated with the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
    */
    public function answers()
    {
        return $this->hasMany(Answer::class);
    }

    /**
     * Get the user's subscription tier.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function subscriptionTier()
    {
        return $this->hasOne(SubscriptionTier::class);
    }

    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function isAdmin()
    {
        return $this->is_admin;
    }

    /**
     * Check if the user completed questionaire.
     *
     * @return bool
     */
    public function questionaireCompleted()
    {
        return $this->questionaire_completed;
    }
}
