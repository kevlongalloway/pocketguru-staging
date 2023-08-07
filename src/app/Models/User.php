<?php

namespace App\Models;

use App\Models\Answer;
use App\Models\SubscriptionTier;
use Laravel\Sanctum\HasApiTokens;
use Orchid\Filters\Types\Like;
use Orchid\Filters\Types\Where;
use Orchid\Filters\Types\WhereDateStartEnd;
use Orchid\Platform\Models\User as Authenticatable;

class User extends Authenticatable {
	use HasApiTokens;
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'name',
		'email',
		'password',
		'permissions',
	];

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = [
		'password',
		'remember_token',
		'permissions',
	];

	/**
	 * The attributes that should be cast to native types.
	 *
	 * @var array
	 */
	protected $casts = [
		'permissions' => 'array',
		'email_verified_at' => 'datetime',
	];

	/**
	 * The attributes for which you can use filters in url.
	 *
	 * @var array
	 */
	protected $allowedFilters = [
		'id' => Where::class,
		'name' => Like::class,
		'email' => Like::class,
		'updated_at' => WhereDateStartEnd::class,
		'created_at' => WhereDateStartEnd::class,
	];

	/**
	 * The attributes for which can use sort in url.
	 *
	 * @var array
	 */
	protected $allowedSorts = [
		'id',
		'name',
		'email',
		'updated_at',
		'created_at',
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
	public function answers() {
		return $this->hasMany(Answer::class);
	}

	/**
	 * Get the user's subscription tier.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasOne
	 */
	public function subscriptionTier() {
		return $this->hasOne(SubscriptionTier::class);
	}

	/**
	 * Check if the user is an admin.
	 *
	 * @return bool
	 */
	public function isAdmin() {
		return $this->is_admin;
	}

	/**
	 * Check if the user completed questionaire.
	 *
	 * @return bool
	 */
	public function questionaireCompleted() {
		return $this->questionaire_completed;
	}

	/**
	 * Check if the user completed questionaire.
	 *
	 * @return bool
	 */
	public function questionaireIsCompleted() {
		$this->questionaire_completed = true;
		$this->save();
	}
}
