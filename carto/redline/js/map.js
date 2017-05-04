/**
 * @author Tyler Waring & Timothy Morrissey
 * Created: Feb 2012
 * Description Script for Redline Project 
 * 
 */

//KML Files -- could be dynamic
var domain='http://www.cartodesco.com/';
var projDir="projects/redline/";
var dataDir=domain+projDir+"data/";
var parcelsURL=dataDir+"REDLINE_WEBMAP_PARCELS.kmz";
var redlineUrl=dataDir+"Redline.kmz";
var stnsUrl=dataDir+"StationBuffer.kml";
var stnbufUrl=dataDir+"Station_buffer.kmz";
var ubdUrl=dataDir+"UBD_TIF.kmz";
var sadUrl=dataDir+"PARCELS_BY_SAD.kmz";
var redlineUrl=dataDir+"Redline.kmz";

//Google Map vars
var kmlMgr;
var infoWindow;
var geocoder;
var map;

var mapCenter=new google.maps.LatLng(35.3388,-80.8237);
//var mapCenter=new google.maps.LatLng(35.34225425327688, -80.82779062695317); // around Huntersville, NC
var mapZoom=12; 

function initialize(){
	
    //init geocoder
    geocoder = new google.maps.Geocoder();

    var myOpts = {
    	  center : mapCenter,
    	  zoom: mapZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
       
	 // Creating the map  
    map = new google.maps.Map(document.getElementById('map'), myOpts);
    
    //NEW -- works but buggy
    kmlMgr = new KmlManager();
    //HACKY - Add layers in order base to top -- should be index value of array
    kmlMgr.addLayer(parcelsURL);
    kmlMgr.addLayer(stnbufUrl);
    kmlMgr.addLayer(redlineUrl);
    kmlMgr.addLayer(ubdUrl);
    kmlMgr.addLayer(sadUrl);
    kmlMgr.addLayer(stnsUrl);    
    kmlMgr.setMap(map);
    
	
} //end initialize


/*
*Use a KML Manager class to handle all KML activities, 
*/

function KmlManager() {
	  this.layers = [];
	}

	KmlManager.prototype.addLayer = function(layerUrl) {
	  this.layers.push(new google.maps.KmlLayer(layerUrl, {preserveViewport:true, suppressInfoWindows:true}));
	}

	KmlManager.prototype.setMap = function(map) {

	  var layers = this.layers;

	  function setMapLayer(i) {
	    layers[i].setMap(map);
	    google.maps.event.addListenerOnce(layers[i], 'defaultviewport_changed', function() {
	      if (i<layers.length-1) {
	        setMapLayer(i+1);
	      }
	    });
	    
	  }

	  setMapLayer(0);
	  
	//TPM -- add infoWindow
    for(var j=0;j < layers.length; j++){
    	lyrUrl=layers[j].getUrl();
    	//if ((lyrUrl == parcelsURL)||(lyrUrl==stnsUrl)||(lyrUrl==sadUrl)){
    	if ((lyrUrl == parcelsURL)||(lyrUrl==stnbufUrl)||(lyrUrl==sadUrl)){
    			addKmlPopup(layers[j]);
    	}
	}    
}

/*
 * TPM Functions
 */
/*
 * addKML
 * @description - create a new google.maps.KmlLayer
 * @input - URL of KML file
 * @return - google.maps.KmlLayer
 */
//function addKML(kml, kmlOpts){
//	return new google.maps.KmlLayer(kml, kmlOpts);
//}

/*
 * addKmlPopup()
 * @description - add the event listener and infowindow for a KML layer
 */
function addKmlPopup(kmlLyr){
	
	google.maps.event.addListener(kmlLyr, 'click', function(kmlEvent) { 
        var info = new google.maps.MVCObject;
   		info.set('position', kmlEvent.latLng);
   			
      	// Check to see if infoWindow already exists, if not we create a new
      	if (!infoWindow) {
        	infoWindow = new google.maps.InfoWindow();
      	}
      	// We set the content of the InfoWindow to our content container
        infoWindow.setContent(kmlEvent.featureData.description);
		//infoWindow.setContent(kmlEvent.latLng.toString());

      	// Lastly we open the InfoWindow
      	infoWindow.open(map, info);
    });
	
}
/*
 * zoomToAddr
 */
function zoomToAddr(){
	var address = document.getElementById("address").value;
    geocoder.geocode( { 'address': address}, function(results, status) {
      	if (status == google.maps.GeocoderStatus.OK) {
        	map.setCenter(results[0].geometry.location);
        	map.setZoom(17);
        	/*var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        	});*/
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
}




/*
 * showLyr 
 * @description - shows the KML layer on the Google basemap
 */
function showLyr(lyr){
	
	//capture current zoom
	zoomLvl=map.getZoom();
	center=map.getCenter();

	//dynamically show
	var lyrUrl;
	switch(lyr){
		case 'parcels':
			lyrUrl=parcelsURL;
			break;
		case 'redline':
			lyrUrl=redlineUrl;
			break;
		case 'stations':
			lyrUrl=stnsUrl;
			break;
		case 'stationBuf':
			lyrUrl=stnbufUrl;
			break;
		case 'sad':
			lyrUrl=sadUrl;
			break;
		case 'ubd':
			lyrUrl=ubdUrl;
			break;
	}

	for (x in kmlMgr.layers){
		if (kmlMgr.layers[x].getUrl() == lyrUrl){
			kmlMgr.layers[x].setMap(map);
		}
	}
	//end 
	
	//maintain input zoom
	map.setZoom(zoomLvl);
	map.setCenter(center);
}

/*
 * hideLyr 
 * @description - hides the KML layer on the Google basemap
 */
function hideLyr(lyr){
	var lyrUrl;
	switch(lyr){
		case 'parcels':
			lyrUrl=parcelsURL;
			break;
		case 'redline':
			lyrUrl=redlineUrl;
			break;
		case 'stations':
			lyrUrl=stnsUrl;
			break;
		case 'stationBuf':
			lyrUrl=stnbufUrl;
			break;
		case 'sad':
			lyrUrl=sadUrl;
			break;
		case 'ubd':
			lyrUrl=ubdUrl;
			break;
	}

	for (x in kmlMgr.layers){
		if (kmlMgr.layers[x].getUrl() == lyrUrl){
			kmlMgr.layers[x].setMap(null);
		}
	}

}
/*
 * ToggleLyr
 * @description - check the value of the legend check box
 * 
 */
function toggleLyr(box){
	if (box.type == 'radio'){
		if (box.value == 'sad'){
			hideLyr('dev');
			showLyr('sad');
		}else if (box.value=='dev'){
			hideLyr('sad');
			showLyr('dev');
		}
	}
	else{
		if (box.checked){
			if ((box.name=='stationBuf') || (box.name=='stations')){
				showLyr('stationBuf');
				showLyr('stations');
			}
			showLyr(box.name);
		}
		else{
			if ((box.name=='stationBuf') || (box.name=='stations')){
				hideLyr('stationBuf');
				hideLyr('stations');
			}
			hideLyr(box.name);
		}
	}
}			
