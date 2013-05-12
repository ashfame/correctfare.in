var cfapp = cfapp || {};

cfapp.supportsLocalStorage = function() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
};

cfapp.saveSelectedCity = function(city) {
	try {
		window.localStorage.setItem('city',city);
	} catch (e) {
		// fail silently, it could fail when storage exceeds quota, in which case this will hold true => (e == QUOTA_EXCEEDED_ERR)
	}
};

cfapp.loadSelectedCity = function() {
	var city = window.localStorage.getItem('city');
	if (city !== null)
		Zepto('#city').val(city);
};

cfapp.saveEnteredReading = function(kms) {
	try {
		window.localStorage.setItem('reading',kms);
	} catch (e) {
		// fail silently, it could fail when storage exceeds quota, in which case this will hold true => (e == QUOTA_EXCEEDED_ERR)
	}
};

cfapp.loadEnteredReading = function() {
	var kms = window.localStorage.getItem('reading');
	if (kms !== null)
		Zepto('#reading').val(kms);
};

cfapp.savePageView = function() {
	if (cfapp.supportsLocalStorage) {
		var pageview = window.localStorage.getItem('pageview');
		if (pageview !== null)
			window.localStorage.setItem('pageview',parseInt(pageview) + 1);
		else
			window.localStorage.setItem('pageview',1);
	}
};

cfapp.decreasePageView = function() {
	console.log('decreasing');
	if (cfapp.supportsLocalStorage) {
		try {
			var pvs = parseInt(cfapp.getPageViews());
			console.log(pvs);
			if (pvs > 0)
				window.localStorage.setItem('pageview',pvs-1);
		} catch (e) {
			// fail silently, we are not storing that much data, that we will exceed storage quota
		}
	}
};

cfapp.getPageViews = function() {
	var pvs = window.localStorage.getItem('pageview');
	if (pvs !== null)
		return pvs;
};

cfapp.loadData = function() {
	$.getJSON('/data.json',function(data){
		console.log(data);
		cfapp.data = data;
		// Select the last city in use
		cfapp.loadSelectedCity();
		// Fill in the last value entered
		cfapp.loadEnteredReading();
		// Based on existing values, show cost
		cfapp.calculate();
	});
};

cfapp.trueRound = function(value, digits) {
	if (!digits) digits = 2;
	return (Math.round((value*Math.pow(10,digits)).toFixed(digits-1))/Math.pow(10,digits)).toFixed(digits);
};

cfapp.calculate = function() {
	var type = Zepto('input[name=type]:checked').val(),
	city = Zepto('#city').val(),
	kms = parseFloat(Zepto('#reading').val()) || 0,
	cost = 0;

	console.log('calculating',type,city,kms);

	if (cfapp.data[city]) {

		if (cfapp.data[city][type]['state'] == 'good') {

			if (kms < cfapp.data[city][type]['base_distance']) {
				cost = cfapp.data[city][type]['base_rate']
			} else {
				// Formula = Base rate + (Meter reading - base distance) * per km rate
				// Because the consumer has already paid for base distance as base rate, that won't be included in per km rate calculation
				cost = cfapp.data[city][type]['base_rate'] + (kms - cfapp.data[city][type]['base_distance']) * cfapp.data[city][type]['per_km_rate'];
			}

			// apply night charges if its night timings
			var night_timings = false;
			var now = new Date();
			now = now.getHours()+':'+now.getMinutes() + ':'+now.getSeconds();
			range_edges = cfapp.data[city][type]['night_timings'].split('-');

			// This logic depends on the fact that night timings will not start after 00:00:00
			// We break down the night timing slots into 2 pieces, one being the time till midnight and second being beyond midnight
			// In both cases we compare using string comparisons
			if ( range_edges[0] != '00:00:00' && range_edges[0] < '24:00:00' ) { // using 24:00:00 here to be able to use simple string comparison
				if ( now > range_edges[0] && now < '24:00:00' )
					night_timings = true;
			} else if ( range_edges[0] >= '00:00:00' ) {
				if ( now >= range_edges[0] && now <= range_edges[1] )
					night_timings = true;
			}

			if ( now < range_edges[0] && now > range_edges[1] )
				night_timings = false;
			else
				night_timings = true;

			if (night_timings) {
				cost += cost * parseInt(cfapp.data[city][type]['night_fare']) / 100; // available as 25% or 50%
			}

		} else {
			alert("Sorry! We don't have fare info of " + city + "'s " + type + ' services');
		}

	} else {
		alert('Error occured! City is not listed in database.');
	}

	// fill in cost
	Zepto('#cost').text(cfapp.trueRound(cost));

	// show hide night timings message
	if (night_timings)
		Zepto('#night-msg').show();
	else
		Zepto('#night-msg').hide();
};

cfapp.checkOnlineStatus = function() {
	if (navigator.onLine)
		cfapp.statusIsOnline();
	else
		cfapp.statusIsOffline();
};

cfapp.statusIsOnline = function() {
	Zepto('#status-light').removeClass('offline').addClass('online');
	Zepto('#online-status span').text('Online');
};

cfapp.statusIsOffline = function() {
	Zepto('#status-light').removeClass('online').addClass('offline');
	Zepto('#online-status span').text('Offline');
};

cfapp.onload = function() {
	if (window.applicationCache) {
		window.applicationCache.addEventListener('updateready', function() {
			if (window.applicationCache.status == window.applicationCache.UPDATEREADY) { // Browser downloaded a new app cache & is ready to swap out the old cache with new one.
				// Swap it in and reload the page to get the new hotness.
				window.applicationCache.swapCache();
				// reload without confirmation since we save user inputs so they won't even notice
				window.location.reload();
			} else {
				// Manifest didn't change. Nothing new on server.
			}
		}, false);
	}
};

cfapp.processGA = function() {
	//if (window.location.hostname == 'correctfare.in') {
	if (navigator.onLine) {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-1921427-11', 'correctfare.in');
		cfapp.sendPVtoGA();
	}
	//}
};

cfapp.sendPVtoGA = function() {
	var pvs = parseInt(cfapp.getPageViews());
	console.log('inside sendPV func',pvs);
	if (navigator.onLine && pvs > 0) {
		ga('send', 'pageview', {
			'hitCallback': function() {
				console.log('inside hitback');
				cfapp.decreasePageView();
				setTimeout(cfapp.sendPVtoGA,3000); // send next tracking request after waiting for 300ms, after completion of the preeceding request. This should sum up to more than a second, so should be fine.
			}
		});
	}
};

window.addEventListener('load', cfapp.onload, false);
window.addEventListener('online',cfapp.statusIsOnline);
window.addEventListener('offline',cfapp.statusIsOffline);

Zepto(function($){
	// Load fare rate slabs
	cfapp.loadData();
	// Check current online/offline status
	cfapp.checkOnlineStatus();
	// save PageView
	cfapp.savePageView();

	$('#city').change(function(){
		cfapp.saveSelectedCity($(this).val());
		cfapp.calculate();
	});

	// Handle meter reading on keyup event since users don't hit enter on mobile devices, & change event fires when field loses the focus, which never happens if the user doesn't need to go to some other field
	$('#reading').bind('keyup',function(){
		cfapp.saveEnteredReading($(this).val());
		cfapp.calculate();
	});

	// Auto or Taxi input has the name "type"
	$('input[name=type]').change(function(){
		cfapp.calculate();
	});

	// Attempt to send data to Google Analytics
	cfapp.processGA();
});