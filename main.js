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
		if (cfapp.data[city][type]['base_rate'] != 0 && cfapp.data[city][type]['per_km_rate'] != 0) {
			if (kms < cfapp.data[city][type]['base_distance']) {
				cost = cfapp.data[city][type]['base_rate']
			} else {
				// Formula = Base rate + (Meter reading - base distance) * per km rate
				// Because the consumer has already paid for base distance as base rate, that won't be included in per km rate calculation
				cost = cfapp.data[city][type]['base_rate'] + (kms - cfapp.data[city][type]['base_distance']) * cfapp.data[city][type]['per_km_rate'];
			}
		} else {
			alert("Sorry! We don't have fare info of " + city + "'s " + type + ' services');
		}
	} else {
		alert('Error occured! City is not listed in database.');
	}

	Zepto('#cost').text(cfapp.trueRound(cost));
};

window.addEventListener('load', function(e) {
	if (window.applicationCache) {
		window.applicationCache.addEventListener('updateready', function(e) {
			if (window.applicationCache.status == window.applicationCache.UPDATEREADY) { // Browser downloaded a new app cache & is ready to swap out the old cache with new one.
				// Swap it in and reload the page to get the new hotness.
				window.applicationCache.swapCache();
				if (1 || confirm('A new version of this site is available. Load it?')) {
					window.location.reload();
				}
			} else {
				// Manifest didn't changed. Nothing new to server.
			}
		}, false);
	}
}, false);

Zepto(function($){
	// Load fare rate slabs
	cfapp.loadData();

	$('#city').change(function(){
		cfapp.saveSelectedCity($(this).val());
		cfapp.calculate();
	});

	$('#reading').change(function(){
		cfapp.saveEnteredReading($(this).val());
		cfapp.calculate();
	});

	$('input[name=type]').change(function(){
		cfapp.calculate();
	});
});