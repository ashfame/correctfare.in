<?php

// Specify the files need to be included in cache
$files_to_specify = array(
	'index.html',
	'style.css',
	'zepto.min.js',
	'main.js',
	'discolytics.js',
	'data.json'
);

$timestamp = 0;

// Add the correct Content-Type for the cache manifest
header('Content-Type: text/cache-manifest');

// Write the first line
echo "CACHE MANIFEST\n";

// Initialize the $hashes string
$hashes = "";

$dir = new RecursiveDirectoryIterator('.');

// Iterate through all the files/folders in the current directory
foreach(new RecursiveIteratorIterator($dir) as $file) {

	if ( $file->IsFile() /*&& $file != "./cache-manifest.php"*/) {

		$filename = $file->getFilename();

		if ( in_array( $filename, $files_to_specify ) ) {
			echo $filename . "\n";
			$timestamp = max( filemtime( $filename ), $timestamp );
		}
	}
}

// Hash the $hashes string and output
echo "# Timestamp Hash: $timestamp"; // This updates whenever a file is modified so that browser detects change in manifest & reloads cache