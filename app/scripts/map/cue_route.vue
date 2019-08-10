<template>
  <div class="mapRoute">
    <div>
      <div id="route-map"></div>
      <div class="geoMarker onPointer" @click="ShowLocation()">
        <img src="/images/map/location_icon.png" alt="">
      </div>
      <div class="nearMarker onPointer" @click="ShowNear()">
        <img src="/images/map/restaurant_marker.png" alt="">
      </div>
      <div class="route_icon" v-if="(searchIcon.show == 'start')"><img width="100%" height="100%" :src="imgSrc+route_tool_icon.startIcon+imgLast"></div>
      <div class="route_icon" v-if="(searchIcon.show == 'end')"><img width="100%" height="100%" :src="imgSrc+route_tool_icon.endIcon+imgLast"></div>
      <div class="route_search">
        <div>
          <div class="form-group">
            <div class="input-group">
              <span class="input-group-btn">
                <button class="btn btn-default" type="button">起始站</button>
              </span>
              <input id="searchStart" type="text" class="form-control" placeholder="請輸入地址" v-model="address[0].formatted" @click="clickSearch('start')">
              <span class="glyphicon glyphicon-remove clear" aria-hidden="true" @click="clear_address(0)"></span>
            </div>
          </div>
          <div class="form-group">
            <div class="input-group">
              <span class="input-group-btn">
                <button class="btn btn-default" type="button">到達站</button>
              </span>
              <input id="searchEnd" type="text" class="form-control" placeholder="請輸入地址" v-model="address[1].formatted" @click="clickSearch('end')">
              <span class="glyphicon glyphicon-remove clear" aria-hidden="true" @click="clear_address(1)"></span>
            </div>
          </div>
        </div>
        <div>
          <img :src="imgSrc+route_tool_icon.changeRoute+imgLast" alt="" @click="changeSearch()">
        </div>
        <div class="form-group">
          <div id="searchBtn" class="fa fa-search button-box-shadow" @click="RouteSearch()">&nbsp;搜尋</div>
        </div>
      </div>
      <div class="route_result" v-if="((routeSearch.show))">
        <div>{{title_target}}
          <div class="button-box-shadow onPointer" style="">確認</div>
        </div>
        <div>
          <div class="col-2 col-sm-2 col-md-2">
            <div class="traffic-font text-over" style="">預估時間</div>
            <div class="traffic-font" style="">價錢</div>
          </div>
          <div class="eachResult col-2 col-sm-2 col-md-2" @click="click_traffic(item, 0)" v-for="(item, index) in traffic_icon" :key="index">
            <div>
              <img :src="imgSrc+item.img[item.click]+imgLast" alt="">
              <div class="traffic-font">{{item.title}}</div>
              <div class="traffic-font">{{item.time}}分鐘</div>
              <div class="traffic-font">{{item.fare}}元</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="placeList" class="p-2">
      <ul id="restaurantBox" class="pl-0">
        <li class="restaurantEach mt-1"  v-for="(item, index) in restaurantList" @click="findRoute(item)" :key="index">
          <span>{{index + 1}}.</span>
          <div>
            <div>{{item.name}}</div>
            <div>{{item.vicinity}}</div>
            <div>距離：{{item.distance.display}} | 價位：{{item.price_level == -1 ? '無提供' : maneyRange[item.price_level-1].text}}</div>
          </div>
        </li>
      </ul>
      <div id="query">
        <button class="fa fa-search button-box-shadow queryBtn" v-for="(item, index) in querylist" @click="queryData(item.way)" :key="index">{{item.text}}</button>
      </div>
      <div id="setRange" class="mt-3">
        篩選  <input type="number" v-model="distanceRange" placeholder="請輸入xxx公尺" />  公尺以內的餐廳
      </div>
      <button class="fa fa-search button-box-shadow closeBtn" onclick="DocStyle('placeList').display = 'none';">關閉</button>
    </div>
  </div>
</template>

<script>
  module.exports = {
    data(){
      return {
        //公用列表
        imgSrc:"/images/map/",
        imgLast:".png",
        route_tool_icon:{changeRoute:"chang_station_icon",startIcon:"ic_location_start",endIcon:"ic_location_end"},
        title_target:"前往目標",
        //交通工具icon
        traffic_icon:[{taxi:"",img:["routeTaxi_h","routeTaxi_s"],title:"計程車",fare:"?",time:"?",click:0},{bus:"",img:["routeBus_h","routeBus_s"],title:"公車",fare:"?",time:"?",click:0}
                      ,{bike:"",img:["routeBike_h","routeBike_s"],title:"腳踏車",fare:"?",time:"?",click:0},{walk:"",img:["routeWalk_h","routeWalk_s"],title:"步行",fare:"?",time:"?",click:0}
                      ,{mix:"",img:["routeMix_h","routeMix_s"],title:"混合運具",fare:"?",time:"?",click:0}],
        which_traffic_choose:-1,
        //地圖相關
        address:[{text:"",formatted:"",placeID:"",rating:0,pos:{},reviews:[]},{text:"",formatted:"",placeID:"",rating:0,pos:{lat:25.042233,lng:121.535497},reviews:[]},{}],
        searchIcon:{show:""},
        map:"",
        self_pos:{lat:-1, lng:-1},
        self_marker:"",
        routeSearch:{show:false,data:{}},
        directionsDisplay:"",
        directionsService:"",
        temp_data:{line:[],marker:[]},
        routes:"",
        //get腳踏車站點跳大眾運輸頁面用
        bike_station:{start:{}, end:{}},
        //餐廳
        originRestaurantList:[],
        restaurantList:[],
        restaurantMarker:[],
        querylist:[{text:'距離排列', way:'distance'}, {text:'價格排列', way:'money'}, {text:'名稱排列', way:'name'}],
        maneyRange:[{text:'便宜', value:1},{text:'正常', value:2},{text:'小貴', value:3},{text:'很貴', value:4},{text:'爆貴', value:5}],
        distanceRange:''
      }
    },
    created: function () {
      const that = this;
      pos_bus.$on('receive', function(get_data){
        switch (get_data.target) {
          case 'location':
            if ((that.self_pos.lat < 0) && (that.self_pos.lng < 0)) {
              let geocoder = new google.maps.Geocoder;
              geocoder.geocode({'location': {lat: get_data.pos.lat, lng: get_data.pos.lng}}, function(results, status) {
                if (status === 'OK') {
                  if (results[0]) {
                    autocomplete_address(results[0].place_id,0);
                    console.log("yes");
                  } else {
                    window.alert('No results found');
                  }
                } else {
                  window.alert('Geocoder failed due to: ' + status);
                }
              });
            }
            that.self_pos = get_data.pos;
            that.self_marker.setPosition(that.self_pos);
            that.self_marker.visible = true;
            break;
          default:
        }
      });
    },
    watch:{
      distanceRange: function(value) {
        const that = this;
        if (value > 0) {
          that.restaurantList = [];
          that.restaurantList.push(...that.originRestaurantList);
          var getList = that.restaurantList.filter((item, index, array) => {
            return item.distance.compare < parseInt(value)
          })
          that.restaurantList = [];
          that.restaurantList.push(...getList);
        }
      }
    },
    methods:{
      findRoute(place){
        const that = this;
        that.address[1] = {
          formatted: place.name,
          placeID: place.place_id,
          pos: {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()},
          rating: place.rating,
          reviews: '',
          text: place.name
        }
        that.map.setCenter({lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
        that.map.setZoom(20);
        Doc('searchEnd').value = place.name;
        DocStyle('placeList').display = 'none';
      },
      queryData(way){
        const that = this;
        switch (way) {
          case 'distance':
              that.restaurantList.sort(function (a, b) {
                return a.distance.compare - b.distance.compare
              })
            break;
          case 'money':
              that.restaurantList.sort(function (a, b) {
                return a.price_level - b.price_level
              })
            break;
          case 'name':
              that.restaurantList.sort(function (a, b) {
                return a.name.length - b.name.length
              })
            break;
        }
      },
      GetDistance(lat1,lon1,lat2,lon2) {
        var rate = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var final = rate * c;
        if (final > 1) {
          return {display: (Math.round(final) + "km"), compare: Math.round(final * 1000)};
        }else if (final <= 1) {
          return {display: (Math.round(final * 1000) + "m"), compare: Math.round(final * 1000)};
        }
      },
      clickSearch(mode){
        this.searchIcon.show = mode;
        switch (mode) {
          case 'start':
            if (typeof this.address[0].pos.lat != "undefined") {
              this.map.setCenter(this.address[0].pos);
              this.map.setZoom(17);
            }
            break;
          case 'end':
            if (typeof this.address[1].pos.lat != "undefined") {
              this.map.setCenter(this.address[1].pos);
              this.map.setZoom(17);
            }
            break;
          default:
        }
        this.cleanRouteDetail();
        this.routeSearch.show = false;
      },
      clear_address(mode){
        //須個別重設，不然要重新渲染全部
        this.address[mode].reviews = "";
        this.address[mode].text = "";
        this.address[mode].pos = {};
        this.address[mode].placeID = "";
        this.address[mode].formatted = "";
        this.address[mode].rating = -1;
        this.routeSearch.show = false;
        document.body.clientWidth > 650 ? $(".route_search").css("border-radius","10px") : null;
        this.cleanRouteDetail();
      },
      changeSearch(){
        //重新渲染全部
        this.$set(this.address,2,this.address[1]);
        this.$set(this.address,1,this.address[0]);
        this.$set(this.address,0,this.address[2]);
        this.cleanRouteDetail();
        this.routeSearch.show = false;
      },
      RouteSearch(){
        //if ((this.address[0].placeID != "") && (this.address[1].placeID != "")) {
        if ((typeof this.address[0].pos.lat != "undefined") && (typeof this.address[1].pos.lat != "undefined")) {
          if (document.body.clientWidth > 650) {
            $(".route_search").css("border-radius","10px 10px 0px 0px");
          }
          this.routeSearch.show = true;
          this.searchIcon.show = "";
          for (let i in this.traffic_icon) {
            this.traffic_icon[i].fare = "?";
            this.traffic_icon[i].time = "?";
            this.traffic_icon[i].click = 0;
          }
          for (let i in this.traffic_icon) {
            //為了顯示計程車，倒著算
            let j = parseInt(this.traffic_icon.length - parseInt(i) - 1);
            this.click_traffic(this.traffic_icon[j], j+1);
          }
        }
      },
      click_traffic(item, show){
        //show = 0 => 顯示路徑
        this.bike_station = {start:{}, end:{}};
        let NowTime = new Date();
        const that = this;
        this.cleanRouteDetail();
        for (let i in this.traffic_icon) {
          this.traffic_icon[i].click = 0;
        }
        item.click = 1;
        let way = {mode:"",option:[],type:0};
        let multiRoute = false;
        switch (item.title) {
          case "計程車":
            way.mode = "DRIVING";
            way.option.push("BUS");
            break;
          case "公車":
            way.mode = "TRANSIT";
            way.option.push("BUS");
            way.type = 5;
            break;
          case "腳踏車":
            way.mode = "WALKING";
            way.type = 2;
            break;
          case "步行":
            way.mode = "WALKING";
            break;
          case "混合運具":
            way.mode = "TRANSIT";
            break;
          default:
        }
        if (item.title == "公車") {multiRoute = true;}
        this.directionsService.route({
          origin: this.address[0].pos,
          destination: this.address[1].pos,
          travelMode: way.mode,
          transitOptions: {
            modes: way.option,
            departureTime: NowTime,
            routingPreference: 'FEWER_TRANSFERS'
          },
          provideRouteAlternatives: multiRoute
        }, function(response, status) {
          if (status == 'OK') {
            console.log(item.title);
            console.log(response);
            if (item.title == "公車") {
              let temp_route = response.routes;
              for (let i in temp_route){
                let route_can_use = false;
                for (let j in temp_route[i].legs[0].steps){
                  if (!(temp_route[i].legs[0].steps[j].instructions.includes("巴士 ") || temp_route[i].legs[0].steps[j].instructions.includes("步行"))) {
                    break;
                  }else if (j == temp_route[i].legs[0].steps.length-1) {
                    response.routes = [];
                    response.routes[0] = temp_route[i];
                    route_can_use = true;
                  }
                }
                if (route_can_use) {break;}
              }
            }
            if (response.routes.length >= 0) {
              that.routes = response.routes;
              if (typeof response.routes[0].fare != "undefined") {
                item.fare = response.routes[0].fare.value;
              }else {
                item.fare = 0;
              }
              if (item.title == "計程車") {
                let taxiFare_list = taxiFare_forecast("daytime");
                let taxiFare = 0;
                for (let i in taxiFare_list) {
                  if (response.routes[0].legs[0].start_address.includes(i)) {
                    if (response.routes[0].legs[0].distance.value > 1250) {
                      taxiFare = parseInt((response.routes[0].legs[0].distance.value - 1250)/taxiFare_list[i][2])*taxiFare_list[i][3] + taxiFare_list[i][1];
                    }else {
                      taxiFare = taxiFare_list[i][1];
                    }
                    break;
                  }
                }
                //取1.05~1.2的中間值1.125
                item.fare = parseInt(taxiFare*1.125);
              }
              item.time = parseInt(response.routes[0].legs[0].duration.value/60);
              if (item.title == "腳踏車") {
                item.time = parseInt(item.time/3);
                item.fare = 0;
              }
              //0代表使用者點選的工具,1代表路線搜尋自動預估所有運具(預設計程車亮起)
              if ((show == 0) || (show == 1)) {
                that.RouteLineShow(0);
                that.title_target = item.title;
              }
            }
          } else {
            item.fare = '-';
            item.time = "無法估計";
          }
        });
      },
      RouteLineShow(num){
        //顯示個別路線
        let line = {way:"",color:"",dash:0,path:"",pic:""};
        let lineSymbol = {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 4,
          strokeWeight: 9
        };
        let polyline_temp = "";
        for (var i in this.routes[num].legs[0].steps) {
          switch (this.routes[num].legs[0].steps[i].travel_mode) {
            case "WALKING":
              line.color = "#000000";
              line.dash = 0;
              break;
            case "TRANSIT":
              line.dash = 1;
              switch (this.routes[num].legs[0].steps[i].transit.line.vehicle.name) {
                case "巴士":
                  line.color = "#a4d6d9";
                  break;
                case "火車":
                  if (this.routes[num].legs[0].steps[i].transit.line.short_name == "高鐵") {
                    line.color = "#fc7405";
                  }else {
                    line.color = "#4f71be";
                  }
                  break;
                case "地下鐵":
                  line.color = this.routes[num].legs[0].steps[i].transit.line.color;
                  break;
                default:
              }
              break;
            case "DRIVING":
              line.color = "#ebbe57";
              line.dash = 1;
              break;
            default:
          }
          line.path = this.decode(this.routes[num].legs[0].steps[i].polyline.points);
          if (i == 0) {
            this.temp_data.marker.push(this.new_marker(line.path[0], this.Travel_img('polyStart')));
            this.temp_data.marker.push(this.new_marker(line.path[line.path.length-1], this.Travel_img('polyCircle')));
          }else if (i == this.routes[num].legs[0].steps.length-1) {
            this.temp_data.marker.push(this.new_marker(line.path[0], this.Travel_img('polyCircle')));
            this.temp_data.marker.push(this.new_marker(line.path[line.path.length-1], this.Travel_img('polyEnd')));
          }else {
            this.temp_data.marker.push(this.new_marker(line.path[0], this.Travel_img('polyCircle')));
            this.temp_data.marker.push(this.new_marker(line.path[line.path.length-1], this.Travel_img('polyCircle')));
          }
          polyline_temp = new google.maps.Polyline({
            path: line.path,
            geodesic: true,
            strokeColor: line.color,
            strokeOpacity: line.dash,
            strokeWeight: 12,
            icons: [{
              icon: lineSymbol,
              offset: '0',
              repeat: '20px'
            }],
            map:this.map
          });
          this.temp_data.line.push(polyline_temp);
        }
        let bounds = new google.maps.LatLngBounds();
        bounds.extend(this.temp_data.marker[0].getPosition());
        bounds.extend(this.temp_data.marker[this.temp_data.marker.length - 1].getPosition());
        this.map.fitBounds(bounds);
      },
      cleanRouteDetail(){
        //取消所有marker和路線
        for (let i in this.temp_data.marker) {
          this.temp_data.marker[i].setMap(null);
        }
        for (let j in this.temp_data.line) {
          this.temp_data.line[j].setMap(null);
        }
        this.temp_data.line = [];
        this.temp_data.marker = [];
      },
      new_marker(data, pic){
        let e = new google.maps.Marker({
            position: data,
            icon: pic,
            map: this.map,
            optimized: false
          });
        return e;
      },
      decode(encoded){
        //解碼google回傳的路線資料
        var points=[ ]
        var index = 0, len = encoded.length;
        var lat = 0, lng = 0;
        while (index < len) {
          var b, shift = 0, result = 0;
          do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);
          var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
          lat += dlat;
          shift = 0;
          result = 0;
          do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);
          var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
          lng += dlng;
          points.push({lat:( lat / 1E5),lng:( lng / 1E5)})
        }
        return points
      },
      Travel_img(pic){
        let image;
        switch (pic) {
          case 'polyStart':
            image = {
              url: '/images/map/polyStart.png',
              scaledSize : new google.maps.Size(56, 50),
              anchor: new google.maps.Point(28, 50)
            };
            break;
          case 'polyEnd':
            image = {
              url: '/images/map/polyEnd.png',
              scaledSize : new google.maps.Size(56, 50),
              anchor: new google.maps.Point(28, 50)
            };
            break;
          case 'polyCircle':
            image = {
              url: '/images/map/ic_directions_map_node.png',
              scaledSize : new google.maps.Size(20, 20),
              anchor: new google.maps.Point(10, 10)
            };
            break;
          default:
        }
        return image;
      },
      ShowLocation(){
        if ((this.self_pos.lat >= 0) && (this.self_pos.lng >= 0)) {
          this.map.setCenter(this.self_pos);
          this.map.setZoom(18);
        }
      },
      ShowNear(){
        DocStyle('placeList').display = '';
      },
      get_ptx_station(){
        let choosed_transport = -1;
        for (let i in this.traffic_icon) {
          if (this.traffic_icon[i].click == 1) {
            choosed_transport = parseInt(i);
            break;
          }
        }
      }
    },
    mounted:function(){
      const that = this;
      const element = document.getElementById("route-map");
      const options = {
        zoom: 17,
        center: new google.maps.LatLng(that.address[1].pos.lat,that.address[1].pos.lng),
        disableDefaultUI: true,
        clickableIcons:false,
        styles:[
          {
            "featureType": "poi.business",
            "stylers": [{ "visibility": "off" }]
          }
        ],
        gestureHandling: 'greedy'
      }
      const map = new google.maps.Map(element, options);
      that.map = map;
      that.directionsDisplay = new google.maps.DirectionsRenderer;
      that.directionsService = new google.maps.DirectionsService;
      new AutocompleteDirectionsHandler();
      function AutocompleteDirectionsHandler() {
        let searchStart_Autocomplete = new google.maps.places.Autocomplete(Doc('searchStart'), ['place_id', 'name', 'types']);
        let searchEnd_Autocomplete = new google.maps.places.Autocomplete(Doc('searchEnd'), ['place_id', 'name', 'types']);
        PlaceChangedListener(searchStart_Autocomplete, 0);
        PlaceChangedListener(searchEnd_Autocomplete, 1);
      }
      function PlaceChangedListener(autocomplete, mode){
        autocomplete.bindTo('bounds', map);
        autocomplete.addListener('place_changed', function() {
          var place = autocomplete.getPlace();
          if (place.place_id) {
            autocomplete_address(place.place_id,mode);
          }else {
            if (mode == 0 && (Doc('searchStart').value != "")) {
              that.searchIcon.show = "start";
              PlacePredictions(Doc('searchStart').value, mode);
            }else if (mode == 1 && (Doc('searchEnd').value != "")) {
              that.searchIcon.show = "end";
              PlacePredictions(Doc('searchEnd').value, mode);
            }
          }
        });
      }
      PlacePredictions=(value, mode)=>{
        var geocoder = new google.maps.Geocoder(),
            service  = new google.maps.places.AutocompleteService(null, {types: ['geocode']});
        service.getPlacePredictions({ input: value },function(predictions, status) {
            if(status=='OK'){
              if (predictions.length != 0) {
                autocomplete_address(predictions[0].place_id, mode);
              }
            }
          }
        );
      }
      autocomplete_address=(place_id, mode)=>{
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({placeId: place_id}, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log(mode);
            that.address[mode].reviews = place.reviews;
            that.address[mode].text = place.name;
            that.address[mode].pos = {lat: parseFloat(place.geometry.location.lat()), lng: parseFloat(place.geometry.location.lng())};
            that.address[mode].placeID = place_id;
            that.address[mode].formatted = place.formatted_address;
            typeof place.rating == 'undefined' ? that.address[mode].rating = -1 : that.address[mode].rating = place.rating;
            //map.setCenter(that.address[mode].pos);
            console.log(place);
          }
        });
      }
      var service = new google.maps.places.PlacesService(map);
      function createMarkers(places) {
        //var bounds = new google.maps.LatLngBounds();
        for (var i = 0, place; place = places[i]; i++) {
          var image = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
          };
          let marker = new google.maps.Marker({
            map: map,
            icon: image,
            title: place.name,
            position: place.geometry.location
          });
          marker.addListener('click',function(){
            DocStyle('placeList').display = '';
            for (const i in that.restaurantList) {
              if (that.restaurantList[i].name == marker.title) {
                that.restaurantList[i].hover = true;
                console.log(that.restaurantList[i].name);
              }else{
                that.restaurantList[i].hover = false;
              }
            }
          });
          that.restaurantMarker.push(marker);
          //bounds.extend(place.geometry.location);
        }
        //map.fitBounds(bounds);
      }
      function nearBySearch() {
        service.nearbySearch({location: {lat: map.getCenter().lat(), lng: map.getCenter().lng()}, radius: 500, type: ['restaurant']},
          function(results, status, pagination) {
            if (status !== 'OK') return;
            console.log('results')
            console.log(results)
            for(let i in results){
              results[i].distance = that.GetDistance(that.self_pos.lat, that.self_pos.lng, results[i].geometry.location.lat(), results[i].geometry.location.lng());
              results[i].price_level == null ? results[i].price_level = -1 : null;
              results[i].hover = false;
            }
            that.restaurantList = [];
            that.restaurantList.push(...results);
            that.originRestaurantList = results;
            for (i in that.restaurantMarker) {
              that.restaurantMarker[i].setMap(null);
            }
            createMarkers(results);
            getNextPage = pagination.hasNextPage && function() {
              pagination.nextPage();
            };
        });
      }
      nearBySearch();
      map.addListener('dragend', function(){
        Doc('searchStart').blur();
        Doc('searchEnd').blur();
        nearBySearch();
        if (that.searchIcon.show !== "") {
          let geocoder = new google.maps.Geocoder;
          geocoder.geocode({'location': {lat: map.getCenter().lat(), lng: map.getCenter().lng()}}, function(results, status) {
            if (status === 'OK') {
              if (results[0]) {
                if (that.searchIcon.show == "start") {
                  autocomplete_address(results[0].place_id,0);
                }else if (that.searchIcon.show == "end") {
                  autocomplete_address(results[0].place_id,1);
                }
              } else {
                window.alert('No results found');
              }
            } else {
              window.alert('Geocoder failed due to: ' + status);
            }
          });
        }
      });
      that.self_marker = new google.maps.Marker({
        icon : {
          url: '/images/map/myLocation.png',
          scaledSize : new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10)
        },
        position : {lat:that.self_pos.lat, lng:that.self_pos.lng},
        map : that.map,
        title : '目前位置',
        visible : false
      });
    }
  }
</script>

