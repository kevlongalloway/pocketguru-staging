<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Support\Facades\File;

/**
 * SitemapController Class
 *
 * This controller handles the generation of an XML sitemap based on URLs and their last modification dates.
 *
 * @package App\Http\Controllers
 */
class SitemapController extends Controller {
	/**
	 * URLs mapped to their corresponding views.
	 *
	 * @var array
	 */
	private $urlAndViewMapping = [
		'https://pocketguruai.com' => 'welcome',
		// Add more URLs and their corresponding views here
	];

	/**
	 * Generate the XML sitemap for the website.
	 *
	 * @return \Illuminate\Http\Response
	 *         The XML sitemap as an HTTP response.
	 */
	public function index() {
		// Create an array of URLs with their last modification dates
		$urls = $this->getUrlsWithLastModDates();

		// Generate the sitemap XML
		$xml = $this->generateXml($urls);

		// Return the XML as a response with the correct content type
		return response($xml)->header('Content-Type', 'application/xml');
	}

	/**
	 * Get URLs with their last modification dates.
	 *
	 * @return array
	 *         An array of URLs with their last modification dates.
	 */
	private function getUrlsWithLastModDates() {
		// Initialize an array to store URLs and their last modification dates
		$urls = [];

		foreach ($this->urlAndViewMapping as $url => $view) {
			$lastModified = $this->getLastModifiedForView($view);

			if ($lastModified !== null) {
				$urls[] = [
					'url' => $url,
					'lastmod' => $lastModified,
				];
			}
		}

		return $urls;
	}

	/**
	 * Get the last modification date for a specific view.
	 *
	 * @param string $viewName
	 *        The name of the view.
	 *
	 * @return string|null
	 *         The last modification date in W3C format or null if the view doesn't exist.
	 */
	private function getLastModifiedForView($viewName) {
		// Define the path to the view file
		$viewPath = resource_path("views/{$viewName}.blade.php");

		// Check if the view file exists
		if (File::exists($viewPath)) {
			// Get the last modification timestamp of the view file
			$lastModifiedTimestamp = File::lastModified($viewPath);

			// Convert the timestamp to a Carbon instance for formatting
			$lastModifiedDate = Carbon::createFromTimestamp($lastModifiedTimestamp);

			// Return the formatted date
			return $lastModifiedDate->toW3cString();
		}

		// If the view file doesn't exist, return null
		return null;
	}

	/**
	 * Generate the XML sitemap from an array of URLs.
	 *
	 * @param array $urls
	 *        An array of URLs with their last modification dates.
	 *
	 * @return string
	 *         The generated XML sitemap.
	 */
	private function generateXml(array $urls) {
		// Create an XML string for the sitemap
		$xml = '<?xml version="1.0" encoding="UTF-8"?>';
		$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
		$xml .= 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
		$xml .= 'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 ';
		$xml .= 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">';

		foreach ($urls as $urlData) {
			$xml .= '<url>';
			$xml .= '<loc>' . $urlData['url'] . '</loc>';
			$xml .= '<lastmod>' . $urlData['lastmod'] . '</lastmod>';
			$xml .= '</url>';
		}

		$xml .= '</urlset>';

		return $xml;
	}
}
