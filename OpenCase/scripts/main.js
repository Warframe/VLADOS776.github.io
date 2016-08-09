﻿	var caseId = 0;
	var win;
	var winNumber = 35;
	var inventory = [];
	var inventory_length = 0;
	var inventory_step = 50,
		inventory_loading = false;
	var caseOpening = false;
	var caseOpenAudio = new Audio();
	caseOpenAudio.src = "../sound/open.wav";
	caseOpenAudio.volume = 0.2;
	
	var caseCloseAudio = new Audio();
	caseCloseAudio.src = "../sound/close.wav";
	caseCloseAudio.volume = 0.2;

	var caseBackAudio = new Audio();
	caseBackAudio.src = "../sound/back.wav";
	caseBackAudio.volume = 0.1;

	var caseScrollAudio = new Audio();
	caseScrollAudio.src = "../sound/scroll.wav";
	//caseScrollAudio.loop = true;
	caseScrollAudio.playbackRate = 1;
	caseScrollAudio.volume = 0.2;
	
	$(".openCase").attr("disabled", null);
	
	$(function() {
		if (!isAndroid())
			inventory = getInventory();
	/*if ($(document.body).data('inventory') == 'no-load' && isAndroid())
	{}else{
		inventory = getInventory();
	}*/
	});

$(document).on("click", ".case", function(){
	caseId = this.id;
	if (cases[caseId].type == "Special") {
		if (typeof $.cookie('specialCases') == 'undefined') $.cookie('specialCases', 0);
		if (parseInt($.cookie('specialCases')) >= cases[caseId].casesToOpen) {
			window.location = "open.html?caseId="+caseId;
		} else {
			$('.popup').css('display', 'block');
			var needToOpen = cases[caseId].casesToOpen - parseInt($.cookie('specialCases'));
			$('#special').text(needToOpen);
			$('#showVideoAd').data();
			$('.js-secretField').text(caseId);
		}		
	} else {
		window.location = "open.html?caseId="+caseId;
	}
});
$(document).on('click', '#closePopup', function() {
	$('.popup').css('display', 'none');
});

function fillCarusel(caseId) {
	var c0 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'consumer' }).mul(7).shuffle();
	var a0 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'industrial' }).mul(7).shuffle();
	var a1 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'milspec' }).mul(5).shuffle();
	var a2 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'restricted' }).mul(5).shuffle();
	var a3 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'classified' }).mul(4).shuffle();
	var a4 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'covert' }).mul(1).shuffle();
	var a5 = cases[caseId].weapons.filter(function(weapon) { return weapon.rarity == 'rare' }).mul(1).shuffle();
	
	if ((Math.rand(0, 10) > 7) && (a5.length + a4.length+a2.length+a1.length != 0)) {a3 = [];}
	if ((Math.rand(0, 10) > 5) && (a5.length + a3.length+a2.length+a1.length != 0)) {a4 = [];}
	if ((Math.rand(0, 10) > 3) && (a4.length + a3.length+a2.length+a1.length != 0)) {a5 = [];}
	
	if (c0 == undefined) {
		var arr = a0.concat(a1, a2, a3, a4, a5).shuffle().shuffle().shuffle();
	} else {
		var arr = c0.concat(a0, a1, a2, a3, a4, a5).shuffle().shuffle().shuffle();
	}
	var el = '';
	while (arr.length <= (winNumber+3)) {
		arr = arr.concat(a1, a2, a3, a4).shuffle().shuffle();
	}
	
	if (arr.length > winNumber +3)
		arr.splice(winNumber + 3, arr.length - (winNumber +3));
	arr.forEach(function(item, index) {
		var img = getImgUrl(item.img);
		var type = item.type;
		if(type.indexOf("|") != -1) {type = type.split("|")[1]}
		type = (type.indexOf('Сувенир') != -1 && Settings.language != 'RU') ? type.replace('Сувенир', 'Souvenir') : type;
		
		if (item.rarity == 'rare') {
			type = '★ Rare Special Item ★';
			name = '&nbsp;';
			img = '../images/Weapons/rare.png';
		} else {
			var name = getSkinName(item.skinName, Settings.language);
		}
		if (item.rarity == 'rare') img = '../images/Weapons/rare.png';
		el += '<div class="weapon">'+
				'<img src="'+img+'" />'+
				'<div class="weaponInfo '+item.rarity+'"><span class="type">'+type+'<br>'+name+'</span></div>'+
				'</div>'
		})
	
	win = arr[winNumber];
	$(".casesCarusel").html(el);
	$(".casesCarusel").css("margin-left", "0px");
}

$(".openCase").on("click", function() {
	$(".weapons").scrollTop(0);
	if (caseOpening || $(".openCase").text() ==  Localization.openCase2.opening[Settings.language]) {return false};
	$(".win").slideUp("slow");
	if($(".openCase").text() == Localization.openCase2.tryAgain[Settings.language]) {backToZero()}
	$(".openCase").text(Localization.openCase2.opening[Settings.language]);
	$(".openCase").attr("disabled", "disabled");
	//var a = 1431 + 16*24;
	var a = 127*winNumber;
	var l = 131;
	var d = 0, s = 0;
	var duration = (Settings.drop) ? 5000 : 10000;
	$(".casesCarusel").animate({marginLeft: -1 * Math.rand(a-50, a+60) }, {
		duration: duration,
		easing: 'easeOutCubic',
		start: function(){
			if (Settings.sounds) caseOpenAudio.play();
			var type = win.type;
			var statTrak = ifStatTrak(type);
			var quality = getItemQuality()[Settings.language == 'RU' ? 1 : 0];
			caseOpening = true;
			
			if (type.indexOf("|") != -1) {type = type.split("|")[1]}
			type = (type.indexOf('Сувенир') != -1 && Settings.language != 'RU') ? type.replace('Сувенир', 'Souvenir') : type;
			var name = getSkinName(win.skinName, Settings.language);
			win.name = name;
			var price = getPrice(type, name, quality, statTrak);
			
			win.type = type;
			
			var stopLoop = 0;
			while (price == 0) {
				quality = getItemQuality()[Settings.language == 'RU' ? 1 : 0];
				price = getPrice(type, name, quality, statTrak);
				if (stopLoop == 15) break;
				stopLoop++;
			}
			
			$(".win_price").html(price+"$");
			
			if (price == 0) getMarketPrice(type, name, quality, statTrak, ".win_price");
			
			if (statTrak) {
				type = "StatTrak™ " + type;
			}
			$(".win_name").html(type + " | " + name);
			$(".win_quality").html(quality);
			$(".win_img").attr("src", getImgUrl(win.img, 1));
			$(".openCase").attr("disabled", "disabled");
			win.statTrak = statTrak;
			win.quality = quality;
			win.price = price;
			//getInventory();
			
		},
		progress: function(e, t) {
			 if (Settings.sounds) {
				progress_animate = Math.round(100 * t),
				s = parseInt(parseInt($(".casesCarusel").css("marginLeft").replace(/[^0-9.]/g, "") - l / 2) / l),
				s > d && (caseScrollAudio.pause(), caseScrollAudio.currentTime = 0,
				caseScrollAudio.play(),
				d++)
			 }
			 
		},
		complete: function(){
			$("#opened").text(parseInt($("#opened").text())+1);
			var price = parseFloat($(".win_price").html());
			if (isNaN(price)) price = 0;
			win.price = price;
			win.new = true;
			inventory.push(win);
			if (isAndroid())
				saveWeapon(win);
			else
				saveInventory();
			if (Settings.sounds) caseCloseAudio.play();
			$(".openCase").text(Localization.openCase2.tryAgain[Settings.language]);
			$(".win").slideDown("fast");
			caseOpening = false;
			$(".openCase").attr("disabled", null);
			$(".weapons").scrollTop(185);
			
			//Statistic
			var caseId = $("#youCanWin span").text();
			statisticPlusOne('case-'+caseId);
			statisticPlusOne('weapon-'+win.rarity);
			if (win.statTrak) 
				statisticPlusOne('statTrak');
			
			var param = parseURLParams(window.location.href);
			if(typeof param != "undefined") {
				caseId = param.caseId[0];
				var fromAd = 0;
				try {
					fromAd = parseInt(param.fromAd[0]);
				} catch (e) {}
				
				if (cases[caseId].type == 'Special') {
					if (!fromAd) {
						var need = $.cookie('specialCases', Number) - cases[caseId].casesToOpen;
						need = (need < 0) ? 0 : need;
						$.cookie('specialCases', need);
					}
					if ($.cookie('specialCases') < cases[caseId].casesToOpen)
						$('.openCase').attr("disabled", "disabled");
				} else {
					statisticPlusOne('specialCases');
				}
			} else {
				statisticPlusOne('specialCases');
			}
		},
		always: function() {
			// $(".openCase").attr("disabled", null);
			caseOpening = false;
		}
	})
})

function backToZero() {
	var l = 131;
	var s = 0, d = 0;
	$(".casesCarusel").animate({marginLeft: 0}, {
		duration: 1000,
		easing: "easeOutQuad",
		start: function() {
			fillCarusel(caseId);
			//caseBackAudio.play();
		},
		always: function() {
			//$(".openCase").attr("disabled", null);
			caseOpening = false;
		}
	})
}

$(".closeCase").on("click", function(){
	window.location = "cases.html";
	/*$(".weapons").css("display", "none");
	$(".openCase").text("Открыть кейс");
	$(".win").hide();
	$(".casesCarusel").stop(true, true);
	$("body").css("overflow", "visible");*/
	caseOpening = false;
})

function statisticPlusOne(cookieName) {
	if (isAndroid()) {
		var stat = client.getStatistic(cookieName);
		stat = parseInt(stat);
		client.saveStatistic(cookieName, stat+1);
	} else {
		var a = $.cookie(cookieName, Number);
		if (typeof a == "undefined")
			a = 0;
		else
			a = parseInt(a);
		a++;
		$.cookie(cookieName, a);
	}
}

function saveStatistic(key, value) {
	if (isAndroid()) {
		client.saveStatistic(key, value);
	} else {
		$.cookie(key, value);
	}
}

function getStatistic(key) {
	if (isAndroid()) {
		return client.getStatistic(key);
	} else {
		return $.cookie(key);
	}
}

function saveInventory() {
	if (typeof localStorage != 'undefined') localStorage.clear();
	localStorage["inventory.count"] = inventory.length;
	for(var i = 0; i < inventory.length; i++) {
		localStorage["inventory.item."+i+".type"] = inventory[i].type;
		localStorage["inventory.item."+i+".skinName"] = inventory[i].skinName;
		localStorage["inventory.item."+i+".rarity"] = inventory[i].rarity;
		localStorage["inventory.item."+i+".img"] = inventory[i].img;
		localStorage["inventory.item."+i+".quality"] = inventory[i].quality;
		localStorage["inventory.item."+i+".statTrak"] = inventory[i].statTrak;
		localStorage["inventory.item."+i+".price"] = inventory[i].price;
		localStorage["inventory.item."+i+".new"] = inventory[i].new;
	}
}

function saveWeapon(weapon) {
	//Weapon - object;
	if (isAndroid()) {
		var rowID = client.saveWeapon(weapon.type, weapon.skinName, weapon.img, weapon.quality, weapon.statTrak, weapon.rarity, weapon.price, weapon.new);
	}
}
function updateWeapon(weapon) {
	//Weapon - object;
	if (isAndroid()) {
		var rowID = client.updateWeapon(weapon.id, weapon.type, weapon.skinName, weapon.img, weapon.quality, weapon.statTrak, weapon.rarity, weapon.price, weapon.new);
	}
}
function getWeapon(id) {
	if (isAndroid())
		return $.parseJSON(client.getWeaponById(id))[0];	
}
function deleteWeapon(id) {
	if (isAndroid())
		client.deleteWeapon(id)

}

function getInventory(count_from, count_to, special) {	
	if (typeof special == 'undefined') special = "";
	count_from = count_from || 1;
	if (typeof count_to == 'undefined' && isAndroid()) count_to =  client.getInventoryLength("");
	
	if (count_to <= 0) return false;
	
	if (isAndroid())
		return _getInventoryAndroid(count_from, count_to, special);
	else
		return _getInventoryLocalStorage();
}

function fromLocalStorageToDB() {
	if (typeof localStorage == 'undefined' || localStorage.length == 0 || !isAndroid()) return false;
	
	var count = parseInt(localStorage["inventory.count"], 10);
	for(var i = 0; i < count; i++) {
		var st;
		var item = {};
		item.type = localStorage["inventory.item."+i+".type"];
		if (typeof item.type == 'undefined') continue;
		item.skinName = getSkinName(localStorage["inventory.item."+i+".skinName"], Settings.language);
		item.rarity = localStorage["inventory.item."+i+".rarity"];
		item.img = localStorage["inventory.item."+i+".img"];
		item.quality = localStorage["inventory.item."+i+".quality"];
		st = localStorage["inventory.item."+i+".statTrak"];
		item.price = Number(localStorage["inventory.item."+i+".price"]);
		item.new = localStorage["inventory.item."+i+".new"];
		if ((st == "true") || (st == "1")) {
			item.statTrak = true;
		} else {
			item.statTrak = false;
		}
		if ((item.new == "true") || (item.new == "1")) {
			item.new = true;
		} else {
			item.new = false;
		}
		saveWeapon(item);
	}
	localStorage.clear();
	return true;
}

function _getInventoryAndroid(count_from, count_to, special) {
	
	var inventoryJSON = client.getInventory(count_from, count_to, special);
	try {
		inventoryJSON = $.parseJSON(inventoryJSON);
	} catch (e) {
		client.deleteAllInventory();
	}
	if (inventoryJSON.length == 0) return false;
	inventory_length = client.getInventoryLength(special);
	if (typeof inventoryJSON[0].error != 'undefined') return [];
	return inventoryJSON;
}

function _getInventoryLocalStorage() {
	if (typeof localStorage == 'undefined') return false;
	var inventoryLocal = [];
	var count = parseInt(localStorage["inventory.count"], 10);
	var new_weapon_count = 0;
	for(var i = 0; i < count; i++) {
		var st;
		var item = {};
		item.type = localStorage["inventory.item."+i+".type"];
		if (typeof item.type == 'undefined') continue;
		item.skinName = getSkinName(localStorage["inventory.item."+i+".skinName"], Settings.language);
		item.rarity = localStorage["inventory.item."+i+".rarity"];
		item.img = localStorage["inventory.item."+i+".img"];
		item.quality = localStorage["inventory.item."+i+".quality"];
		st = localStorage["inventory.item."+i+".statTrak"];
		item.price = Number(localStorage["inventory.item."+i+".price"]);
		item.new = localStorage["inventory.item."+i+".new"];
		if ((st == "true") || (st == "1")) {
			item.statTrak = true;
		} else {
			item.statTrak = false;
		}
		if ((item.new == "true") || (item.new == "1")) {
			item.new = true;
			new_weapon_count++;
		} else {
			item.new = false;
		}
		
		inventoryLocal.push(item);
	}
	if (new_weapon_count) menuNotification('inventory', ''+new_weapon_count)
	inventory_length = inventoryLocal.length;
	return inventoryLocal;
}

function getInventoryCost(special) {
	special = special || '';
	if (isAndroid())
		return client.getInventoryCost(special);
	else
		return 0;
}

function checkInventoryForNotification() {
	var new_weapon_count = 0;
	if (isAndroid()) {
		new_weapon_count = client.getInventoryLength("WHERE isNew = 'true'");
	} else {
		if (typeof localStorage == 'undefined')
			return false;
		var count = parseInt(localStorage["inventory.count"], 10);
		for (var i = 0; i < count; i++) {
			var item_new = localStorage["inventory.item." + i + ".new"];
			if ((item_new == "true") || (item_new == "1"))
				new_weapon_count++;
		}
	}
	if (new_weapon_count) menuNotification('inventory', ''+new_weapon_count)
}

function menuNotification(items, message) {
	switch(items) {
		case 'inventory':
			if ($('#local-menu-inventory .menu-notification').length) {
				$('#local-menu-inventory .menu-notification').text(message);
			} else {
				$('#local-menu-inventory').append('<span class="menu-notification">'+message+'</span>');
			}
			break
		default:
		break
	}
}

function deleteMenuNotification(items) {
	switch(items) {
		case 'inventory':
			$('#local-menu-inventory .menu-notification').remove();
			break
		default:
		break
	}
}

function getImgUrl(img, big) {
	if (img.indexOf("images/") != -1)
		if (typeof big != "undefined") {
			return img.replace("125fx125f", "383fx383f");
		} else {
			return img;
		}
	else if (img.indexOf(".png") != -1) 
		return "../images/Weapons/"+img;
	else if (img.indexOf("steamcommunity") == -1) {
		if (typeof big != "undefined")
			return prefix + img + postfixBig;
		else
			return prefix + img + postfix;
	}
	else 
		if (typeof big != "undefined") {
			return img.replace("125fx125f", "383fx383f");
		} else {
			return img;
		}
}

function changeLocation(url) {
	window.location = url;
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") {
        return;
    }

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=");
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) {
            parms[n] = [];
        }

        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function isAndroid() {
	try {
		var a = client.isAndroid();
		return true;
	} catch (e) {
		return false;
	}
}

Array.prototype.shuffle = function() {
	var o = this;
	for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
}
Array.prototype.mul = function(k) {
	var res = []
	for (var i = 0; i < k; ++i) res = res.concat(this.slice(0))
	return res
}
Math.rand = function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/*Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};*/