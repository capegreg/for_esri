// for jsbin
        var paoDetails = {
          client: {
            visitorIP: '',
          },
          context: {
            parid: '1847300959',
            datums: {
              parid: '',
              usesDefaults: false,
              coordinates: {
                lat: '27.491344',
                lon: '-82.414233',
              },
            },
          },
          support: {
            fullscreenSupported: true,
            fullscreenApi: '', // determine support api for fullscreen in mcpao-utils.js
          },
          networkStatus: {
            esriAlive: false,
          },
          gis: {
            displayPage: 'fullaerial', // aerial is shown in parcel details, fullaerial shown in fullscreen
            referer: null,
            ownerSwitched: false,
            mapIsLoaded: false, // skips rebuilding aerial map if already done
            fullmapWasLoaded: false, // full map was loaded from search page
            services: {
              latestYearAerial: {
                url: 'https://www.mymanatee.org/gisimg/rest/services/current/aerials/ImageServer',
              },
              priorYearAerials: {
                url: 'https://www.mymanatee.org/gisimg/rest/services',
              },
              mapLayerAndLabels: {
                url: 'https://gis.manateepao.com/arcgis/rest/services/Website/WebLayers/MapServer',
                indices: {
                  parcelSearch: 0,
                  parcelLines: 1, // used in property card to get lines
                  subdivisions: 21,
                  cooperatives: 22,
                  condominiums: 23,
                },
              },
              districtPLSSLayers: {
                url: 'https://gis.manateepao.com/arcgis/rest/services/Website/DistrictPLSSLayers/MapServer',
              },
              printService: {
                url: 'https://gis.manateepao.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task',
              },
              pictoWebSearch: {
                url: 'https://gis.manateepao.com/arcgis/rest/services/Website/PictoWebSearch/MapServer/0',
              },
              geometryServer: {
                url: 'https://gis.manateepao.com/arcgis/rest/services/Utilities/Geometry/GeometryServer',
              },
            },
            queryFields:
              'OBJECTID,PARID,PAR_OWNER_NAME1,PAR_NBHD_NAME,SITUS_ADDRESS,SALE_DATE_LQ,SALE_PRICE_LQ,SALE_VORI_LQ,SALE_CODE_LQ,TAXPARCELTYPE',
          },
        };