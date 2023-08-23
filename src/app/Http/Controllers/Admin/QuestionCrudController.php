<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\QuestionRequest;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

/**
 * Class QuestionCrudController
 * @package App\Http\Controllers\Admin
 * @property-read \Backpack\CRUD\app\Library\CrudPanel\CrudPanel $crud
 */
class QuestionCrudController extends CrudController {
	use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
	use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;

	/**
	 * Configure the CrudPanel object. Apply settings to all operations.
	 *
	 * @return void
	 */
	public function setup() {
		CRUD::setModel(\App\Models\Question::class);
		CRUD::setRoute(config('backpack.base.route_prefix') . '/question');
		CRUD::setEntityNameStrings('question', 'questions');
	}

	/**
	 * Define what happens when the List operation is loaded.
	 *
	 * @see  https://backpackforlaravel.com/docs/crud-operation-list-entries
	 * @return void
	 */
	protected function setupListOperation() {
		CRUD::setFromDb(); // set columns from db columns.

		/**
		 * Columns can be defined using the fluent syntax:
		 * - CRUD::column('price')->type('number');
		 */
	}

	/**
	 * Define what happens when the Create operation is loaded.
	 *
	 * @see https://backpackforlaravel.com/docs/crud-operation-create
	 * @return void
	 */
	protected function setupCreateOperation() {
		CRUD::setValidation(QuestionRequest::class);

		CRUD::field([ // select_from_array
			'name' => 'question_type',
			'label' => "Question Type",
			'type' => 'select_from_array',
			'options' => [1 => 'Multiple Choice', 2 => 'Text Input'],
			'allows_null' => false,
			'default' => 1,
			// 'allows_multiple' => true, // OPTIONAL; needs you to cast this to array in your model;
		]);

		CRUD::addField([
			'name' => 'question',
			'type' => 'text',
			'label' => "Question",
		]);

		/**
		 * Fields can be defined using the fluent syntax:
		 * - CRUD::field('price')->type('number');
		 */
	}

	/**
	 * Define what happens when the Update operation is loaded.
	 *
	 * @see https://backpackforlaravel.com/docs/crud-operation-update
	 * @return void
	 */
	protected function setupUpdateOperation() {
		$this->setupCreateOperation();
	}
}
