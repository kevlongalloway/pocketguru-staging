<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSystemMessagesTable extends Migration {
	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up() {
		Schema::create('system_messages', function (Blueprint $table) {
			$table->id();
			$table->integer('service_id');
			$table->string('sub_service')->nullable();
			$table->text('tags')->nullable();
			$table->text('content');
			$table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down() {
		Schema::dropIfExists('system_messages');
	}
}
