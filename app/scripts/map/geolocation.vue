<template>
  <div class="">

  </div>
</template>

<script>
  module.exports = {
    data(){
      return {
        geo_options:{
            enableHighAccuracy: true,
            maxmumAge:60000,
            timeout:10000
        },
        geo_pos:{lat:-1, lng:-1}
      }
    },
    created: function () {
      const that = this;

    },
    methods:{

    },
    mounted:function(){
      const that = this;
      geo_success=(position)=>{
        that.geo_pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        pos_bus.$emit('receive', {target:'location', pos:{lat:position.coords.latitude, lng:position.coords.longitude}});
      }
      geo_error=(err)=>{
        console.log('ERROE(' + err.code + '): ' + err.message);
      }
      if('geolocation' in navigator){
        navigator.geolocation.watchPosition(geo_success, geo_error, that.geo_options);
      } else{
        console.log("no support geolocation");
      }
    }
  }
</script>

<style scoped>
</style>
