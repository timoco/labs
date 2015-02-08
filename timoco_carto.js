/*
* timoco_carto.js
/*
Timoco.js for CartoDB Leaflet app 
##Abstract out after prototype
*/

var ne_states_viz_url     = 'http://timoco.cartodb.com/api/v2/viz/0cef06f6-a05d-11e4-a076-0e0c41326911/viz.json';
var retail_health_viz_url = 'http://timoco.cartodb.com/api/v2/viz/88f0c25e-9fa3-11e4-9ab7-0e0c41326911/viz.json';
var retail_health_tbl = 'economic_pharma_health_retail_10yr_by_state';
var user_name = 'timoco';
var api_key = '2d80f8152e590c2f8d7da82f92f397ffa697bab8';
var viz_json_url = retail_health_viz_url;
var map;

function init() {
  console.log('Initialize Leaflet Map');
  map = new L.Map('map', {
      zoomControl: false,
      center: [39, -97],
      zoom: 4 
    });

  //var sql = new cartodb.SQL({ user: 'timoco', format: 'geojson' });
  console.log('Add the DarkMatter base map from cartodb cdn');
  //#CartoDB DarkMatter basemap from cdn
  L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        {attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy;<a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  
  //##Timoco.js
  console.log('Add viz from timoco');
  

  //#Add CartoDB Lyr to leaflet map
  cartodb.createLayer(map, viz_json_url)
    .addTo(map)
    .done(function(layer) {
        //Build data filter layers
        buildDataFilters();
        // layer.setInteraction(true);
        // layer.on('featureOver', function(e, pos, latlng, data) {
        //       cartodb.log.log(e, pos, latlng, data);
        // });
        // layer.on('error', function(err) {
        //       cartodb.log.log('error: ' + err);
        // });
      })
      .on('error', function(err) {
      alert("some error occurred: " + err);
    });
 
  // vs.
  //#Create Vis at runtime.
  // When you create a visualization using the CartoDB website, you automatically get a viz.json URL defining it. 
  //When you want to create the visualization via JavaScript you don’t always have a viz.json, 
  //so you will need to pass all the required parameters to the library so that it can create the visualization at runtime 
  //and display it on your map. It is pretty simple.
  
  //create a layer with 1 sublayer
  // cartodb.createLayer(map, {
  //               user_name: 'timoco',
  //               type: 'cartodb',
  //               sublayers: [{
  //                         sql: "economic_pharma_health_retail_10yr_by_state",
  //                    cartocss: '#economic_pharma_health_retail_10yr_by_state {marker-fill: #238E23;}'
  //                }]
  // })
  // .addTo(map) // add the layer to our map which already contains 1 sublayer  
  // .done(function(layer) {
  //   // create and add a new sublayer
  //   layer.setInteraction(true);
  //   layer.on('featureOver', function(e, pos, latlng, data) {
  //        cartodb.log.log(e, pos, latlng, data);
  //   });
    
  //   layer.createSubLayer({
  //     sql: "SELECT num_establishments FROM economic_pharma_health_retail_10yr_by_state where year=2002 ",
  //     cartocss: '#economic_pharma_health_retail_10yr_by_state {marker-fill: #F0F0F0;}'
  //   });

  //   // change the query for the first layer
  //   layer.getSubLayer(0).setSQL("SELECT * FROM economic_pharma_health_retail_10yr_by_state");
  // }); // promise .done
}; //end init


/*  buildDataFilters()
    Build the Data Filters values in the CartoDB table 
    via SQL API  http://docs.cartodb.com/cartodb-platform/sql-api.html
*/ 
function buildDataFilters(){
  console.log("Building the Data Filters");
  var cdb_tbl_struct_qry='SELECT * from '+retail_health_tbl +' LIMIT 1';
  var cbd_sql_api_struct='http://'+user_name+'.cartodb.com/api/v2/sql?q='+cdb_tbl_struct_qry+'&api_key='+api_key;
  var metric_list = $("<select id='metric' />");

  $.getJSON(cbd_sql_api_struct, function(data) {
      var fields = data.fields;
      //console.log(fields);//$('#tbl_results').append('<br />'+data.total_rows+'<br />'); 
      $.each(fields, function(key, val) { 
          if (val.type == 'number'){               //only allow numberic metrics #raw
            if (key === 'num_establishments'){    //default to number establishments
              $('<option />', {value: key, text: key, selected: 'selected'}).appendTo(metric_list);
            } else { 
        //      console.log(val);
              $('<option />', {value: key, text: key}).appendTo(metric_list);
            } 
          }
      })
      metric_list.appendTo('#metric_selector');
    })

  var data_filters = ['nacis_category','year'];
  var sql = new cartodb.SQL({user: 'timoco'});

  $.each(data_filters, function(key,filter){
    //console.log(filter);
      var filter_list = $("<select id='"+filter+"' />");
      sql.execute("SELECT distinct " + filter + " FROM "+ retail_health_tbl)//" WHERE id > {{id}}", { id: 3 })
      .done(function(data) {
        //console.log(data.fields);
        $.each(data.rows, function(key, val) {  
          $.each(val, function (k,v){
            
            $('<option />', {value: v, text: v}).appendTo(filter_list);
          }); 
        });
      })
      .error(function(errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    })  

    filter_list.appendTo('#data_filters');

  })
}

// function updateMap(){
/*
*/
function animateMetricByYears(){  
  console.log("Animate over Years");
  var nacis=$('#nacis_category').val();
  var metric=$('#metric').val();
  
  cartodb.createLayer(map, {
    user_name: 'timoco',
    type: 'cartodb',
    sublayers: [{
      sql:"SELECT * FROM economic_pharma_health_retail_10yr_by_state WHERE nacis_category='"+nacis+"' AND year="+$('#year').val(),//+ stateList,//('MA','NY','CA')",
      cartocss: '#layer {polygon-fill: #66FF66;}'
    }]
  })
  .addTo(map) // add the layer to our map which already contains 1 sublayer
  .done(function(layer) {
    var dynLyr;
    //setTimeout(function() {
      //Create CartoDBLayer from query
     var spatQry = "SELECT * FROM economic_pharma_health_retail_10yr_by_state WHERE nacis_category='"+nacis+"' AND year="+$('#year').val();
     dynLyr = layer.createSubLayer({
         sql: spatQry,//"SELECT * FROM economic_pharma_health_retail_10yr_by_state WHERE postal in ('MA','NY','CA')",
         cartocss: '#economic_pharma_health_retail_10yr_by_state { polygon-fill: #7AA3CC;}',
         interactivity: metric
       }); 
    dynLyr.setInteraction(true);  
    // dynLyr.setCartoCSS('#economic_pharma_health_retail_10yr_by_state { polygon-fill: #FF4719;}' );
    var dynoCss='#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 114438] {polygon-fill: #B10026;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 19428] {polygon-fill: #E31A1C;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 6645] {polygon-fill: #FC4E2A;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 2543] {polygon-fill: #FD8D3C;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 1348] {polygon-fill: #FEB24C;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 674] {polygon-fill: #FED976;}';
    dynoCss += '#economic_pharma_health_retail_10yr_by_state [ num_establishments <= 283] {polygon-fill: #FFFFB2;}';
    dynLyr.setCartoCSS(dynoCss);
     // dynLyr.setInteractivity('cartodb_id,postal,'+metric);
     // print on the console the place name on hover
     dynLyr.on('featureOver', function(e, pos, pixel, data) {
         console.log(data);
     });
     dynLyr.on('featureClick', function(e, pos, pixel, data) {
         console.log('data');
     });
  })
  .on('error', function(err) {
     alert("some error occurred: " + err);
  });

}

function updateCDBMap(){
  console.log(arguments.callee.name);
  console.log('Use cartodb.js to update map with Metric & Dimension Filtering via cartodb.SQL functionality [vs. SQL API ]');
  //call the CartoDB SQL API to return a GeoJSON object based on year, sector, economic indicators
  //SQL API vals #think scope
  //cdb_tbl_query = "SELECT * FROM economic_pharma_health_retail_10yr_by_state WHERE nacis_category='Retail trade' AND year in ('2002')";
  console.log('Updating Map from Form Values');
  var analytic_dim = $('#nacis_category').val(); 
  var time_dim = $('#year').val();
  var metric = $('#metric').val();
  var cdb_tbl_query="SELECT * FROM "+retail_health_tbl+" WHERE nacis_category='"+ analytic_dim +"' AND year in ('"+ time_dim+"')";
  console.log(cdb_tbl_query);
  
  var sql = new cartodb.SQL({ user: 'timoco' });
  //sql.execute("SELECT year FROM economic_pharma_health_retail_10yr_by_state where name = {{st_name}}", { st_name: 'Arizona' })

  //sql statements make dynamic input or time
    //#Get Measures per state
    /*SELECT cartodb_id, state_name, year, nacis_category, num_establishments, 
      revenue_1k, num_paid_employees  
      FROM economic_pharma_health_retail_10yr_by_state 
      WHERE nacis_category='Retail trade' AND year in ('2002')
      ORDER BY state_name ASC*/

  //sql.execute("SELECT * FROM economic_pharma_health_retail_10yr_by_state WHERE nacis_category='Retail trade' AND year in ('2002')")
  //#sql.execute method
  sql.execute(cdb_tbl_query)
    .done(function(data) {
      console.log("Filtered cartodb.SQL Query Return Data");
      console.log(data); // all the data I need to loop through GeoJSON
      var tbl_fields = data.fields;
      var tbl_dataArray  = data.rows;
      var viz_results = "";
      viz_results+="Total Number of Rows :: " + data.total_rows + "</br>";
      
      for(row in tbl_dataArray) {
        var infoJson = tbl_dataArray[row];
        console.log(infoJson);
        console.log(row);
        // viz_results+="<br />--<br />";
        viz_results+="Data Cube  :: " + infoJson.postal+ " :: "+infoJson.year+" :: "+infoJson.nacis_category+"  :: <br/> " ;
      }
      document.getElementById('tbl_results').innerHTML = viz_results;
      
      console.log('Creating CartoDBLayer from data');
      var cartodb_lyr = cartodb.createLayer(map, data);
      console.log('Adding CartoDBLayer to Map');
      cartodb_lyr.addTo(map);
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    })

}

/*
* Function to use the CartoDB Maps API to load data on map
*/
function loadCDBNamedMap(){
  console.log(arguments.callee.name);
  cartodb.createLayer(map, {
    user_name: user_name,
    type: 'namedmap',
    named_map: {
      name: "county_ex",
      layers: [{
        layer_name: "t",
        interactivity: "cartodb_id, state, name, pop"
       }]
     }
    })
    .addTo(map)
    .done(function(layer) {
      console.log('createLayer done');
      console.log(layer);
      //console.loge(layer.getSubLayer(0));
      layer.getSubLayer(0).setInteraction(true);

      // on mouseover
      layer.getSubLayer(0).on('featureOver', function(e, pos, pixel, data) {
        // print data to console log
        console.log("Event #" + data.cartodb_id + ", name " + data.name + ", max population: " + data.pop);
      });
 
      // show infowindows on click
      cdb.vis.Vis.addInfowindow(map, layer.getSubLayer(0), ['cartodb_id','state','name', 'pop']);
    })
    .error(function(errors) {
      // errors contains a list of errors
      console.log("errors:" + errors);
    });
}
     
// function get_sim_GeoJSON(){
//   console.log('get_sim_GeoJSON for economic_pharma_health_retail_10yr_by_state');
//   //call the CartoDB SQL API to return a GeoJSON object based on year, sector, economic indicators
//   //SQL API vals #think scope
//   // http://{account}.cartodb.com/api/v2/sql?q={SQL statement}&api_key={Your API key}
//   //user_name = 'timoco';
//   //var api_key = '2d80f8152e590c2f8d7da82f92f397ffa697bab8';
//   //var cdb_tbl_geoJson = 'http://timoco.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM economic_pharma_health_retail_10yr_by_state LIMIT 1';
//   var spatQry='SELECT * from '+retail_health_tbl ;//+ ' LIMIT 1';
//   var spatQry="SELECT cartodb_id,postal,ST_AsGeoJSON(the_geom) as the_geom FROM "+retail_health_tbl+" WHERE nacis_category='Retail trade' AND year in ('2002')";
//   var cdbSqlUrl='http://'+user_name+'.cartodb.com/api/v2/sql?q='+spatQry+'&api_key='+api_key;
//   var cdbSqlUrlPub='http://'+user_name+'.cartodb.com/api/v2/sql?q='+spatQry;
//   console.log(cdbSqlUrl);
  
//   //#jQuery method 
//   $('#tbl_results').text('RETURN VALUES');
//   $.getJSON(cdbSqlUrl, function(data) {
//       $('#tbl_results').append('<br />'+data.total_rows+'<br />'); 
//       $.each(data.rows, function(key, val) { 
//       $('#tbl_results').append('<br />Query Return Row<br />'); 
//         //console.log(key);
//        console.log(val);
//         $.each(val, function (k,v){
//           $('#tbl_results').append(k+ ':-: '+v+ '<br />');
//         });
//         // do something!
//       });
//     });  
//  var sql = new cartodb.SQL({ user: 'timoco' });
//   sql.execute(spatQry)
//     .done(function(data) {
//       console.log("Timoco Carto SQI API Return Spatial Data");
//       console.log(data); // all the data I need to loop through GeoJSON
//       var tbl_fields = data.fields;
//       var tbl_dataArray  = data.rows;
//       var viz_results = "";

//       for(row in tbl_dataArray) {
//         var infoJson = tbl_dataArray[row];
//         // console.log(infoJson);
//         viz_results+="<br />--<br />";
//         viz_results+="Data Cube  :: " + infoJson.the_geom+ "<br/> " ;
       
//       }
//       document.getElementById('tbl_results').innerHTML = viz_results;
      
//       console.log(infoJson);
//       cartodb.createLayer(map, infoJson).addTo(map);
      
//    })
    
//     .error(function(errors) {
//       // errors contains a list of errors
//       console.log("errors:" + errors);
//     })
//} //get_sim_GeoJSON


/*
*
*Loop over a collection of years 
*
*
*/function animateMapByYears(){  

  $("#year > option").each(function(k,v) {
    var update_args={};
    //pass each value to the UpdateMap
    update_args["time"] = this.value;
    update_args["analytic"] = 'Pharmacies and drug stores'; //default
    update_args["metric"] = 'num_establishments';           //default
    update_args["step_rt"] = 5000;
    update_args["step"]=k;
    console.log(update_args);
    //updateMap(update_args);//.delay(3000);
  
    // setTimeout(function() {console.log('sleeping for 5 secs before next .each?');}, 5000);
    setTimeout(function() {updateMap(update_args);
                          $("#proc_results").html('Displaying '+update_args.metric+' for '+update_args.time+' '+update_args.analytic);}, 
                          update_args.step_rt*(k)); 
                          
//    setTimeout(function() {$("#"+value).addClass('active');}, 3000*i);
  });
}
/*
*
*Update the Map based on the Filter Values for Dimensions (Category, Year) & Metrics 
*Example usage of CartoDB SQL API to query based on form elements
*
*/
function updateMap(parms){
  console.log(parms);
  if (typeof parms === "undefined"){
    console.log('Updating Map from Form Values');
    var analytic_dim = $('#nacis_category').val(); 
    var time_dim = $('#year').val();
    var metric = $('#metric').val();
    var step_rt;
    //return;
  } else {
    var analytic_dim = parms.analytic; 
    var time_dim = parms.time;
    var metric = parms.metric;
    var step_rt=parms.step_rt;// return;
  }

  console.log("Update Map for "+ analytic_dim + " : "+metric+" by Year = "+ time_dim);
  var spatQry="SELECT * FROM "+retail_health_tbl+" WHERE nacis_category='"+ analytic_dim +"' AND year in ('"+ time_dim+"')";
  var cdbSqlUrlPub='http://'+user_name+'.cartodb.com/api/v2/sql?q='+spatQry;
  var cdbSqlUrl='http://'+user_name+'.cartodb.com/api/v2/sql?format=GeoJSON&q='+spatQry+'&api_key='+api_key;
  console.log("##------------Update Params-----------------");
  console.log("#Dimensions:");
  console.log("# Analytic: "+analytic_dim);
  console.log("# Time: "+time_dim);
  console.log("# Geographic: ");
  console.log("#Metric: "+metric);
  console.log("##------------------------------------------");
  console.log(cdbSqlUrl);

  //update the display
  $('#tbl_results').text('RETURN VALUES');
  var dataLyr;
  // $(selector).getJSON(url,data,success(data,status,xhr))
  
  //Wrap API call in var for promise
  // var hipsterJesus = {
  //         html: function() {
  //               return $.getJSON('http://hipsterjesus.com/api/').then(function(data) {return data.text;});  
  //         }
  // };
  // hipsterJesus.html().done(function(html) {$("tbl_results").append(html);}); 
  // console.log(hipsterJesus);

  var cartodb_sql_api_req = {
      cdb_data_resp: function(){ return $.getJSON(cdbSqlUrl).then(function(data) {console.log("getJSON to CartoDB SQL API result/callback function");
                                          dataLyr = L.geoJson(data, {
                                          style: style,
                                          onEachFeature: onEachFeature
                                          });
      // dataLyr.addTo(map);
                              })//.getJson/end of CartoDB SQI API call
      }
  }; 
  console.log(cartodb_sql_api_req);
  cartodb_sql_api_req.cdb_data_resp().done(function(data){
    dataLyr.addTo(map);
    console.log(data);
    // //Output Tabular display ## need style
    // $('#tbl_results').append('<br />'+data.features.length+' Rows returned<br />');
    //   $.each(data.features, function(key, val) {         
    //       console.log(data.features.length);
    //       // console.log(val);
    //       $('#tbl_results').append('<br />Query Return Row<br />'); 
    //         // console.log(key);
    //         //console.log(val.properties.postal);
    //         $.each(val.properties, function (k,v){
    //             // console.log(k);
    //             // console.log(v);
    //             $('#tbl_results').append(k+ ':-: '+v+ '<br />');
    //             });
    //   }); //each feature
  }); // end of cdb_data_resp() done

} //updateMap
     
  


/*
*** --- Leaflet helpers --- ***
* mostly from docs
*/

//http://leafletjs.com/examples/geojson-example.html
function onEachFeature(feature, layer) {
    // console.log(feature);
    // console.log(layer);

    // var popupContent = "<p>I started out as a GeoJSON " +
    //     feature.geometry.type + ", but now I'm a Leaflet vector!</p>";
    var popupContent="";
    popupContent+='Dimensions ::  ';
    popupContent+='<ul><li>Time: '+ feature.properties.year +'</li>';
    popupContent+='<li>Geographic: '+ feature.properties.postal +'</li>';
    popupContent+='<li>Analytic : '+ feature.properties.nacis_category +' </li>';
    popupContent+='</ul>';
    popupContent+='Metrics ::  ';
    popupContent+='<ul><li>Number of establishments = '+feature.properties.num_establishments+'</li>'; 
    popupContent+='<li>Number of employees = '+feature.properties.num_paid_employees+'</li>';
    popupContent+='<li>Revenue ($1000) = '+feature.properties.revenue_1k+'</li>'; 
    popupContent+='<li>Payroll ($1000) = '+feature.properties.annual_payroll_1k+'</li>';
    popupContent+='</ul>';
    
    if (feature.properties && feature.properties.popupContent) {
      popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent);
    
}

    

function getColor(d) {
    //console.log(d);
    return d >= 7500 ? '#B10026' :
           d > 5000  ? '#E31A1C' :
           d > 2500  ? '#FC4E2A' :
           d > 1500  ? '#FD8D3C' :
           d > 750   ? '#FEB24C' :
           d > 500   ? '#FED976' :
           d >= 100  ? '#FFFFB2' :
                      '#FFFFB2';

           //  d >= 114438 ? '#B10026' :
           // d > 19428  ? '#E31A1C' :
           // d > 6645  ? '#FC4E2A' :
           // d > 2543  ? '#FD8D3C' :
           // d > 1348   ? '#FD8D3C' :
           // d > 674   ? '#FEB24C' :
           // d >= 283   ? '#' :
           //              '#';

              // #ffffb2
              // #fed976
              // #feb24c
              // #fd8d3c
              // #fc4e2a
              // #e31a1c
              // #b10026
}
function style(feature) {
    // console.log($('#metric').val());
    // console.log(feature);
    var metric_val = eval("feature.properties."+$('#metric').val());
    // console.log(metric_val);
    // console.log(feature.properties.postal);
    return {
        fillColor: getColor(metric_val),
        weight: 0.5,
        opacity: 1,
        color: 'gray',
        dashArray: '1',
        fillOpacity: 0.9
    };
}



// you could use $(window).load(main);
window.onload = init;
