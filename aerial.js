$(function () {
  require([
    'esri/Map',
    'esri/views/MapView',
    'esri/layers/ImageryTileLayer',
    'esri/layers/MapImageLayer',
    'esri/layers/GroupLayer',
    'esri/layers/FeatureLayer',
    'esri/widgets/LayerList',
    'esri/widgets/Popup',
    'esri/request',
    'esri/Graphic',
    'esri/layers/GraphicsLayer',
    'esri/widgets/Sketch',
    'esri/widgets/Sketch/SketchViewModel',
    'esri/rest/support/IdentifyParameters',
    'esri/rest/identify',
    'esri/rest/support/Query',
    'esri/rest/query',
    'esri/core/reactiveUtils',
    'esri/widgets/Expand',
    'esri/geometry/geometryEngine',
    'esri/widgets/Measurement',
    'esri/widgets/Print',
    'esri/widgets/Print/PrintViewModel',
    'esri/widgets/ScaleBar',
    'esri/identity/IdentityManager',
    'esri/widgets/Search',
    'esri/geometry/Extent',
    'esri/widgets/Search/SearchSource',
    'esri/core/promiseUtils',
  ], function (
    Map,
    MapView,
    ImageryTileLayer,
    MapImageLayer,
    GroupLayer,
    FeatureLayer,
    LayerList,
    Popup,
    esriRequest,
    Graphic,
    GraphicsLayer,
    Sketch,
    SketchViewModel,
    IdentifyParameters,
    identify,
    Query,
    query,
    reactiveUtils,
    Expand,
    geometryEngine,
    Measurement,
    Print,
    PrintViewModel,
    ScaleBar,
    IdentityManager,
    Search,
    Extent,
    SearchSource,
    promiseUtils
  ) {
  
	window.getFullscreenApiSupport();
	paoDetails.support.isMobileDevice = detectMobileDevice();

	// ***************************************
	// ***************************************
	// Esri, removed majority of functionality, including
	// widgets for this public jsbin created on 3/13/2024 
	//
	// Map default center is ['-82.414233', '27.491344']
	// 
	// Thank you!
	//
	// Gregory Bologna
	// ***************************************
	// ***************************************
		
	// ***************************************
	// esri, map layer on load will be priorYearAerials
	// set to 1 was working for years. 
	// to test, change to 0 or 1.
	// Due to lates api changes, you will see 
	// that it now needs to be 0
	var _get_item_at_value_ = 1;
	// ***************************************
	
	// ***************************************
	// esri, our default zoom is 12
	// and was working for years. 
	// to test, change to 10 or 12.
	// Due to lates api changes, you will see 
	// that it now needs to be 10
	var _mapview_default_zoom_ = 10;
	// ***************************************

    var global_parid = '1847300959';
  
    /**
     * GIS Status messages to eu
     */
    const AlertMessageOptions = Object.freeze({
      Default: 1,
      AerialImageryNotAvailable: 2,
      MapLayersNotAvailable: 3,
    });

    let alertUser = AlertMessageOptions.Default;
    let alertContainer = document.createElement('div');

    // Calcite auto close speed definistions.
    const PaoAlertAutoDismissSpeed = Object.freeze({
      Fast: 'fast',
      Medium: 'medium',
      Slow: 'slow',
    });

    /**
     * Mutable global vars.
     */

    // The maximum records ArcGIS server will return.
    let MAX_QUERY_RECORDCOUNT = 0;
    let sketchViewModel;
    let sketchGeometry;
    let sketchPointGeometry;
    let layerListExpand;
    let subjectParSubdivision;
    let identifyParams;
    let currentProgressBar;

    /**
     * Active widget properties.
     */
    let activeWidget = {
      buttonId: '',
      containerId: '',
      state: 'inactive',
      worksMinimized: false,
      showTitleBar: false,
      lastActiveButton: '',
    };

    // One of either measure distance or area.
    let widget = null;

    // Prevent tool events while in modal state.
    let modalActive = false;

    // Used to compute the progress indicator steps.
    let totalProgressSteps = 0;

    // Flag when a sketch is created to handle sketch subject parcels.
    let sketchIdentifyDoneFlag = false;

    // The gis feature extent of the currently displayed parcel
    // helps to center and zoom parcel at start position.
    let goto_target_params = {
      target: null,
      center: null,
      scale: null,
      zoom: null
    };

    // Helps to set parcel boundary when returning to minimized.
    let current_parcel_feature = null;

    // Holds selected method type properties.
    let userSelectedMethod = {
      id: '',
      label: '',
      value: ''
    };

    // Primary panel created in mcpao-common.js
    let primaryPanel = '';
    // Holds map layers.
    let layerList = '';
    // Compare items to reset with current reset process to determine if
    // reset is finished to avoid calciteListChange events. Not resetting when zero.
    let resetStateLength = 0;
    // Holds esri Search widget.
    let searchWidget = null;

    // GIS data fields used for addresses
    const DG_ADDR_COLUMNS = [
      'PARID',
      'PAR_MAIL_LABEL1',
      'PAR_MAIL_LABEL2',
      'PAR_MAIL_LABEL3',
      'PAR_MAIL_LABEL4',
      'PAR_MAIL_LABEL5',
      'PAR_MAIL_LABEL6',
    ];


    // Count of parids in subject property can be used to manage zoom level
    let queried_parids_in_subject_property = null;


    // Signal query is executing.
    let waitingForResults = false;

    /**
     * Prevent repeated calls to update data table
     * or labels until buffer query is finished.
     */
    let blockUpdateDataTable = false;

    /***
     * Service context URLs.
     */
    let priorYearAerialsUrl = paoDetails.gis.services.priorYearAerials.url;
    let mapLayerAndLabelsUrl = paoDetails.gis.services.mapLayerAndLabels.url;
    let districtPLSSLayersUrl = paoDetails.gis.services.districtPLSSLayers.url;
    let printServiceUrl = paoDetails.gis.services.printService.url;

    /***
     * Rest request services folders
     */
    let parcelSearchUrl = `${mapLayerAndLabelsUrl}/${paoDetails.gis.services.mapLayerAndLabels.indices.parcelSearch}`;
    let condominiumsUrl = `${mapLayerAndLabelsUrl}/${paoDetails.gis.services.mapLayerAndLabels.indices.condominiums}`;
    let cooperativesUrl = `${mapLayerAndLabelsUrl}/${paoDetails.gis.services.mapLayerAndLabels.indices.cooperatives}`;
    let subdivisionsUrl = `${mapLayerAndLabelsUrl}/${paoDetails.gis.services.mapLayerAndLabels.indices.subdivisions}`;


    // Flag if county tiles loaded.
    let mapsLoadedSuccessfully = false;
    // esri provided legacy alert shown on map.
    IdentityManager.on('dialog-create', () => {
      IdentityManager.dialog.open = false;
      alertUser = AlertMessageOptions.AerialImageryNotAvailable;
      userAlert();
      fixBaseLayerFont(map);
    });

    // Basemap
    const map = new Map({
      basemap: 'streets-vector',
    });

    /**
     * ImageServer URL format
     * years > 2002 ex. 2003/AERIAL_2003_RGB
     * years < 2003 ex. 1994/AERIAL_1994_BW
     * ex. https://www.mymanatee.org/gisimg/rest/services/1994/AERIAL_1994_BW/ImageServer
     */
    let url = priorYearAerialsUrl + '/?f=pjson';
    esriRequest(url, {
      responseType: 'json',
      timeout: 5000,
    })
      .then(function (response) {
        var regex = /^[0-9]{4}$/;
        var years = [];
        $.each(response.data.folders, function (index, value) {
          if (regex.exec(value) !== null) {
            years.push(value);
          }
        });

        /**
         * Assemble the ImageServer URL from manatee county gis years
         */
        let tileServers = [];
        years.forEach(function (year) {
          var layerUrl =
            priorYearAerialsUrl +
            '/' +
            year +
            '/AERIAL_' +
            year +
            (year > 2002 ? '_RGB' : '_BW') +
            '/ImageServer';
          var tlay = new ImageryTileLayer({
            url: layerUrl,
            title: year,
          });
          tileServers.push(tlay);
        });
        return tileServers;
      })
      .then(function (tileServers) {
        //
        // Create the maps to add to the view
        //
        const priorYearAerials = new GroupLayer({
          title: 'Aerials',
          visible: true,
          visibilityMode: 'exclusive',
          layers: tileServers,
        });
        map.add(priorYearAerials);

        // sketch, buffer drawing depends on this layer index being first
        map.reorder(priorYearAerials, 0);

        mapsLoadedSuccessfully = tileServers.length > 0;
      })
    ['catch']((error) => {
      /**
       * Prepare a dismisable alert message for aerial container footer
       */
      if (error.message === 'Timeout exceeded') {
        console.error('esriRequest', error);
      }
      alertUser = AlertMessageOptions.AerialImageryNotAvailable;
      userAlert();
      if (!mapsLoadedSuccessfully) {
        fixBaseLayerFont(map);
      }
    });

    /**
     * handled by the server
     */
    const mapLayerAndLabels = new MapImageLayer({
      url: mapLayerAndLabelsUrl,
      legendEnabled: true,
      visible: true,
      title: 'Map Layers & Labels',
    });
    map.add(mapLayerAndLabels);

    /**
     * handled by the server
     */
    const districtPLSSLayers = new MapImageLayer({
      url: districtPLSSLayersUrl,
      legendEnabled: true,
      visible: true,
      title: 'Districts & PLSS Layers',
    });
    map.add(districtPLSSLayers);

    let padding = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    // Easing settings:
    // https://easings.net/
    // Supported named presets are: linear, in-cubic, out-cubic, in-out-cubic,
    // in-expo, out-expo, in-out-expo, in-out-coast-quadratic

    let animationOptions = {
      animate: true, // default true
      duration: 400, // duration of the animation in milliseconds default 200
      // Possible Values: "linear"|"ease"|"ease-in"|"ease-out"|"ease-in-out"
      easing: 'linear', // easing function to slow down when reaching the target
      speedFactor: 0.5, // make animation x times slower than default
    };

    // create room for fullscreen banner
    if (paoDetails.gis.displayPage === 'fullaerial') {
      padding['top'] = 55;
    }

    //
    let default_popup = {
      viewModel: {
        actions: {
          zoom: false,
        },
        actionsMenuEnabled: false,    // actions within the popup should display in a menu item
        includeDefaultActions: false, // Indicates whether or not to include defaultActions in the Popup's UI.
      },
      // Works better without dock enabled.
      dockEnabled: paoDetails.support.isMobileDevice,
      dockOptions: {
        // Disables the dock button from the popup.
        buttonEnabled: false,
        // Ignore default sizes that trigger responsive docking.
        breakpoint: false
      },
      visibleElements: {
        featureNavigation: true,
        closeButton: true,
      }
    };
	
    let view = new MapView({
      map: map,
      container: 'aerialMapViewer',
      center: ['-82.414233', '27.491344'],
      zoom: _mapview_default_zoom_,
      navigation: {
        momentumEnabled: !paoDetails.support.isMobileDevice,
        mouseWheelZoomEnabled: !paoDetails.support.isMobileDevice,
        browserTouchPanEnabled: true, // allow it on mobile !paoDetails.support.isMobileDevice
      },
      padding: padding,
      constraints: {
        maxScale: 0,
        minScale: 300000
      },
      popup: default_popup,
    });

    const mapEl = document.querySelector('#aerialMapViewer');

    const queryFeatureLayer = new FeatureLayer({
      url: parcelSearchUrl,
      geometryType: 'polygon',
      title: 'featureLayer-hideinlist',
      //distance: 0,
      spatialReference: {
        wkid: 102659,
      },
      outFields: [
        'OBJECTID',
        'PARID',
        'PAR_MAIL_LABEL1',
        'PAR_MAIL_LABEL2',
        'PAR_MAIL_LABEL3',
        'PAR_MAIL_LABEL4',
        'PAR_MAIL_LABEL5',
        'PAR_MAIL_LABEL6',
        'PAR_SUBDIVISION',
        'TAXPARCELTYPE',
      ]      
    });

    // add a GraphicsLayer for the sketches and the buffer to the view.map
    const sketchLayer = new GraphicsLayer({
      title: 'sketchLayer-hideinlist',
    });

    // The default color for selected buffer subject

    let invalidSymbol = {
      type: 'simple-fill',
      style: 'diagonal-cross',
      color: 'rgba(255, 0, 0, 1)',
      outline: {
        color: 'rgba(255, 0, 05, 1)',
        width: 4, // points
      },
    };
    let pointSymbol = {
      type: 'simple-marker',
      style: 'circle',
      color: 'rgba(255, 77, 106, 1)',
      size: 8,
      outline: {
        color: 'rgba(255, 255, 255, 1)',
        width: 1, // points
      },
    };
    let polylineSymbol = {
      type: 'simple-line',
      color: [211, 132, 80, 0.7],
      width: 6
    };
    let polygonSymbol = {
      type: 'simple-fill',
      color: [150, 150, 150, 0.2],
      outline: {
        color: [252, 251, 253],
        width: 2
      },
    };
    let lineAcqua = [66, 244, 206, 1];
    let lineWhite = [255, 255, 255, 1];
    let symbolLineAcqua = {
      type: 'simple-fill',
      style: 'none',
      outline: {
        color: lineAcqua,
        width: 2,
      },
    };

    /**
     *
     * @param {*} map
     */
    function fixBaseLayerFont(map) {
      let maplayers = map.layers.filter((a) => {
        try {
          return (
            a.title === 'Map Layers & Labels' ||
            a.title === 'Districts & PLSS Layers'
          );
        } catch (error) {
          console.error('maplayers: ' + error);
        }
      });
      let aerials = map.layers.filter(function (a) {
        try {
          return a.title === 'Aerials';
        } catch (error) {
          console.error('aerials: ' + error);
        }
      });
      try {
        LayerListAdjustBasemapFont(aerials, maplayers);
      } catch (error) {
        console.error('LayerListAdjustBasemapFont: ' + error);
      }
    }

    /**
     * Handles mouse cursor icon.
     * @param {*} c
     */
    function doCursor(c) {
      mapEl.style.cursor = c;
    }

    /**
     * Called when mapview is loaded.
     */
    view.when(() => {
      afterMaploaded();
    })
      .catch((error) => {
        // report error if browser doesn't support webgl.
        let tf = error.name.includes("webgl");
        console.error('view.when', error, tf);
      });

    /**
     * Execute processes that may only run after the map has loaded.
     */
    const afterMaploaded = async () => {
      try {
       
        await mapReady();

      } catch (error) {
        console.error('afterMaploaded', error);
      }
    };

    /**
     * Watch mapview events
     */
    function handleViewWatches() {

      // Watch view.
      reactiveUtils.watch(
        () => [
          view?.updating,
          view?.stationary,
          view?.navigating,
          view?.interacting,
          view?.zoom,
        ],
        ([updating, stationary, navigating, interacting, zoom]) => {

          // console.log(`updating: ${updating}`);
          // console.log(`zoom: ${view.zoom}`);
          // console.log(`scale: ${view.scale}`);
          // console.log(`extent.height: ${view.extent.height}`);
          // console.log(`extent.width: ${view.extent.width}`);
          // console.log(`--------------------`);

          // return if buffer tool is hidden
          let bc = document.getElementById('pao-buffer-container');
          if (bc && bc.hasAttribute('hidden') && bc.hidden)
            return;

          disableBufferExportTool(updating, interacting, zoom);

        }
      );
    }

    /**
     * 
     */
    view.watch('fatalError', function (error) {
      if (error) {
        console.error(
          'Fatal Error! View has lost its WebGL context. Attempting to recover...'
        );
        // Call this method to clear any fatal errors resulting from a lost WebGL context.
        view.tryFatalErrorRecovery();
      }
    });

    /**
     * ticket  #1977
     * @param {*} results
     */
    function sortMineral(results) {
      // a = first element for comparison
      // b = second element for comparison

      // > 0	sort a after b
      // < 0	sort a before b
      // === 0	keep original order of a and b

      // First sort parid asc
      results.sort((a, b) => {
        return a.feature.attributes.PARID > b.feature.attributes.PARID ? 1 : -1;
      });

      // Sort mineral to end of all parcels
      results.sort((a, b) => {
        if (
          (a.feature.attributes.TAXPARCELTYPE === 'MINERAL RIGHT') &
          (b.feature.attributes.TAXPARCELTYPE === 'PARCEL')
        )
          return 1;
        else return -1;
      });

      // Sort condo after all parcels. condo will always end up before minerals
      results.sort((a, b) => {
        if (a.feature.attributes.TAXPARCELTYPE === 'MINERAL RIGHT') return 0;

        if (
          (a.feature.attributes.TAXPARCELTYPE === 'CONDO UNIT') &
          (b.feature.attributes.TAXPARCELTYPE === 'PARCEL')
        )
          return 1;
        else return -1;
      });
    }
 


    /**
     * Do not show header title when minimized or mobile
     * @param {*} showTitle
     */
    const setViewHeaderTitle = (showTitle) => {
      if (!showTitle) {
        document.querySelector('#header-title').setAttribute('hidden', '');
        view.padding = {
          top: 0,
        };
      } else {
        document.querySelector('#header-title').removeAttribute('hidden');
        view.padding = {
          top: 55,
        };
      }
    };

    /**
     * Call from mapReady
     */
    const addlayerListExpand = () => {
      layerListExpand = new Expand({
        content: (layerList = new LayerList({
          view: view,
          listItemCreatedFunction: (event) => {
            let item = event.item;
            let key = item.title.toUpperCase().replace(/ /g, '');
            if (item.layer.type === 'group' || item.layer.type === 'tile') {
              if (key === 'AERIALS') {
                reactiveUtils.when(
                  () => !item.layer.visible,
                  () => {
                    layerListFormat(item);
                  }
                );
                reactiveUtils.when(
                  () => item.layer.visible,
                  () => {
                    layerListFormat(item);
                  }
                );

                // Call once on WebLayers load to toggle black\yellow layer list
                reactiveUtils
                  .whenOnce(() => item.layer.visible)
                  .then(() => {
                    layerListFormat(item);
                  });
              } // end key
            } // end type

            if (item.layer.type === 'map-image') {
              if (key === 'MAPLAYERS&LABELS' || 'DISTRICTS&PLSSLAYERS') {
                // Don't show sublayers of layers
                if (
                  item.layer.allSublayers &&
                  item.layer.allSublayers.length > 0
                ) {
                  item.layer.allSublayers.forEach((item) => {
                    if (item.title === 'Parcel Search') {
                      item.listMode = 'hide';
                    }
                    if (item.sublayers && item.sublayers.length > 0) {
                      item.sublayers.forEach((item) => {
                        item.listMode = 'hide';
                      });
                    } // end sublayers
                  }); // end forEach
                } // end allSublayers

                // Add legend for each layerList item
                if (item.layer.type != 'group') {
                  let keyIndex = map.layers.findIndex((item) => {
                    let k = item.title.toUpperCase().replace(/ /g, '');
                    return k === key;
                  });
                  if (keyIndex) {
                    let featureLayer = map.layers.getItemAt(keyIndex);

                    item.panel = {
                      content: 'legend',
                      layerInfos: [
                        {
                          layer: featureLayer,
                          title: 'Manatee County Property Appraiser',
                        },
                      ],
                      open: false,
                    };
                  }
                } // end type
              } // end key
            } // end type

            // Used to exclude extra years in service layer. This is no longer required with the new gis service
            if (
              item.layer.type !== 'map-image' &&
              item.layer.type !== 'wms' &&
              item.layer.type !== 'tile'
            ) {
              switch (key) {
                case 'BUFFERLAYER-HIDEINLIST':
                case 'SKETCHLAYER-HIDEINLIST':
                case 'FEATURELAYER-HIDEINLIST':
                  item.layer.listMode = 'hide';
                  break;
              }
            }
          },
        })), // end layerList
        view: view,
        autoCollapse: true,
        expanded: false,
        expandTooltip: 'Map Layers',
        group: 'top-right',
        mode: 'floating',
      });
    };

    /**
     * Pass accordion id to export individual buffers
     * arr elements shall be single-quoted.
     * With every(), return false is equivalent to a break, 
     * and return true is equivalent to a continue.
     * @param {*} id
     * @returns
     */
    function getParcelsData(id) {
      try {
        let tmp = [];
        let total_rows = [];

        // check if this is for an item and add to tmp array with a key
        if (id?.length > 0 && dgData[id]?.rows?.length > 0) {
          tmp[id] = dgData[id];
        } else {
          tmp = dgData;
        }
        // check
        if (tmp) {
          // Push all subject parids for all accordion item types to tmp_subjects.
          // ex. tmp['accd-579703409'].taxParcelTypeList['CONDO_UNIT'].subjects
          let tmp_subjects = [];
          if (includeSubjectParcelsOn) {
            Object.keys(tmp).forEach((key) => {
              Object.keys(tmp[key].taxParcelTypeList).forEach((p) => {
                let r = p.replace(/_/g, ' ');
                if (taxParcelTypesSelectedString.includes(r)) {
                  tmp[key].taxParcelTypeList[p].subjects.forEach((parid) => {
                    tmp_subjects.push(parid);
                  });
                }
              });
            });
          }

          // Remove duplicates.
          if (includeSubjectParcelsOn) // leave to optimize.
            total_rows = [...new Set(tmp_subjects)];

          // Push all accordion parids for all accordion item types to total_rows.
          // tmp[key].taxParcelTypeList[p].parids does not include subjects.
          Object.keys(tmp).forEach((key) => {
            Object.keys(tmp[key].taxParcelTypeList).forEach((p) => {
              let r = p.replace(/_/g, ' ');
              if (taxParcelTypesSelectedString.includes(r)) {
                tmp[key].taxParcelTypeList[p].parids.forEach(parid => {
                  total_rows.push(parid);
                });
              }
            });
          });
          // Total parids and subjects (when included).
          return total_rows;
        }
        return null;

      } catch (error) {
        console.error('getParcelsData', error);
      }
    }

    /**
     * Clear the geometry and set the default renderer
     */
    function clearGeometry() {
      sketchGeometry = null;
      sketchPointGeometry = null;
      // Discards any partially created graphic.
      sketchViewModel.cancel();
      // Removes all current layers and returns the layers
      // Removed from the layers collection.
      sketchLayer.removeAll();
      bufferLayer.removeAll();
      view.graphics.removeAll();
      // Preserve buffer size if just clearing map.
      if (!activeAccordionId === '')
        bufferSize = 0;
    }

    /**
     * 
     * @returns 
     */
    function sketchGeometryMode() {
      if (bufferSize === 0)
        if (chosenSelectionMethod === ChosenSelectionMethodOptions.ParcelId)
          return sketchGeometry;

      if (sketchPointGeometry) {
          return sketchPointGeometry;
      } else {
        return sketchGeometry;
      }
    }

    /**
     * Generic delay with promise.
     * @param {*} ms 
     * @returns 
     */
    const delay = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };


    /**
     * Use to remove outline from specific block button.
     * @param {*} id 
     */
    const removeButtonOutline = async (id) => {
      await customElements.whenDefined('calcite-block');
      await delay(200);
      let node = document.querySelector(`#${id}`);
      if (node) {
        let el = node.shadowRoot.querySelector('.header-container>button');
        if (el) {
          el.style.setProperty('outline', 'none');

          el = node.shadowRoot.querySelector('.header-container>button.toggle');
          if (el)
            el.style.setProperty('background-color', 'var(--calcite-ui-foreground-1)');
        }
      }
    };

    /**
     * Block heading font color only available in shadowroot.
     * @param {*} id 
     */
    const changeHeadingStyle = async (id, color_var) => {
      await customElements.whenDefined('calcite-block');
      await delay(200);
      let node = document.querySelector(`#${id}`);
      if (node) {
        let el = node.shadowRoot.querySelector('.heading');
        if (el) {
          el.style.setProperty('color', `var(${color_var})`);
        }
      }
    };

    /**
     * Use to remove outline from all block buttons only available in shadowroot.
     */
    const removeAllButtonOutline = async () => {
      await customElements.whenDefined('calcite-block');
      await delay(200);
      let nodes = document.querySelectorAll('calcite-block');
      if (nodes) {
        nodes.forEach((p) => {
          let el = p.shadowRoot.querySelector('.header-container>button');
          if (el)
            el.style.setProperty('outline', 'none');
        });
      }
    };

    /**
     * Query feature layer by parid and set feature attributes
     * that can be added to popup.
     * Required to resolve callbacks after completing asynchronous steps.
     * @param {*} parid
     */
    const queryFeatureSet = (parid) => {
      return new Promise((resolve) => {
        let queryObject = new Query({
          returnGeometry: true,
          outSpatialReference: view.spatialReference,
          outFields: [paoDetails.gis.queryFields],
          orderByFields: ['PARID'],
          where: `PARID='${parid}'`,
        });
        query
          .executeQueryJSON(parcelSearchUrl, queryObject)
          .then(setParcelFeatures)
          .then(() => {
            doCursor('auto');
            resolve(true);
          })
        ['catch'](promiseRejected);
      }).catch((error) => {
        resolve(true);
      });
    };

    /**
     * Show popup when parcel not found from click event, or
     * go to clicked feature.
     * @param {*} featureSet
     */
    function setParcelFeatures(featureSet) {
      return new Promise((resolve) => {
        if (paoDetails.gis.ownerSwitched || paoDetails.gis.displayPage !== 'fullaerial') {
          // Show parcel not found in popup if no features.
          if (!featureSet?.features.length > 0) {
            view.goTo({
              target: view.extent,
              zoom: 12
            }, animationOptions);

            let content =
              "<div><div class='pao-esri-pop-content-not-found'>Aerial Not Found</div><div class='pao-esri-pop-sub-content-not-found'>An aerial for this parcel was not found, or is not currently available.</div><div>";
            //let cls = popup.container.className;
            // popup.container.className = cls + ' map-not-found-popup';
            // popup.dockOptions.buttonEnabled = false;
            // popup.collapseEnabled = false;
            closeVisiblePopup();

            // Set popup attributes for not found message.
            let cls = view.popup.container.className;
            view.popup.container.className = cls + ' map-not-found-popup';
            view.popup.dockOptions.buttonEnabled = false;
            view.popup.collapseEnabled = false;

            view.openPopup({
              title: `<span class='pao-esri-pop-title-not-found pao-blue'>Parcel Id: ${global_parid}</span>`,
              location: view.center,
              content: content,
            });
            resolve(true);

          } else {
            view.graphics.removeAll();
            featureSet.features.forEach((feature) => {
              // store feature for go back usage
              current_parcel_feature = feature;
              goto_target_params.target = feature.geometry;
              goto_target_params.scale = null;
              goto_target_params.center = null;

              doViewGoto(feature)
                .then(() => {
                  addGraphics(feature, symbolLineAcqua);
                  resolve(true);
                })
            });
          }
        } else {
          resolve(true);
        }
      }).catch((error) => {
        resolve(true);
      });
    }

    /**
     * Adds graphic with symbol and set the sketchGeometry mode
     * for the selected parcel.
     * @param {*} featureSet
     * @returns
     */
    const addGraphicModeSketchGeometry = async (featureSet) => {
      try {
        return await new Promise((resolve) => {
          clearGeometry();
          // add graphic and set sketch mode for chosen feature
          if (featureSet?.features[0]) {
            doViewGoto(featureSet.features[0])
              .then(() => {
                addGraphics(featureSet.features[0], symbolLineAcqua);
                // add sketch polygon to buffer selection
                sketchGeometry = featureSet.features[0].geometry;
                resolve(featureSet);
              })
          }
        });
      } catch (error) {
        console.error('addGraphicModeSketchGeometry', error);
        return false;
      }
    };

    /**
     * Adds graphic to map and go to it.
     * @param {*} feature
     * @param {*} symbol
     */
    function addGraphics(feature, symbol) {
      try {
        let g = new Graphic({
          geometry: feature.geometry,
          attributes: feature.attributes,
          symbol: symbol,
        });
        view.graphics.add(g);
      } catch (error) { console.error('addGraphics', error); }
    }

    /**
     * Zoom, pan view.
     * Do this before adding graphics.
     * @param {*} feature 
     * @returns 
     */
    function doViewGoto(feature) {
      return new Promise((resolve) => {
        try {

          // Skip zoom if multiple accordions.
          let skipZoom = Object.keys(dgData)?.length > 0;

          let zoom = view.zoom;
          let center = [feature.geometry.centroid.longitude, feature.geometry.centroid.latitude];


            if (paoDetails.gis.ownerSwitched) {

              view.goTo({
                target: feature.geometry.extent,
                scale: goto_target_params.scale
              }, animationOptions)
                .then(() => {
                  resolve(true);
                });

            } else {

              // Go to details extent.
              view.goTo({
                target: goto_target_params.target,
                scale: goto_target_params.scale
              }, animationOptions)
                .then(() => {
                  goto_target_params.scale = view.scale;
                  goto_target_params.center = view.center;
                  resolve(true);
                });
            }
        } catch (error) {
          console.error('doViewGoto: ' + error);
          resolve(true);
        }
      }).catch((error) => {
        console.error('doViewGoto: ' + error)
        resolve(true);
      });
    }

    /**
     * Adds a feature Layer query to map
     */
    function addQueryFeatureLayer() {
      return new Promise((resolve) => {
        if (queryFeatureLayer) {
          map.add(queryFeatureLayer);
          resolve(true);
        }
      }).catch((error) => { console.error('addQueryFeatureLayer', error); });

    }

    /**
     *
     * @param {*} error
     */
    function promiseRejected(error) {
      console.error('Promise rejected', error);
      return false;
    }

    /**
     * Allow identify popup anytime.
     */
    function setUpGraphicClickHandler() {
      view.on('click', (event) => {
        if (activeWidget?.state === 'active' && activeWidget?.buttonId !== 'bufferButton')
          return;
        // Only when click does not include an active widget.
        executeIdentifyTask(event);
      });
    }

    /**
     *
     * @returns
     */
    function userAlert() {
      let ac = document.getElementsByClassName('alert-container');
      if (ac.length === 0) {
        alertContainer.setAttribute('class', 'alert-container');
      }
      let alertDiv = document.createElement('div');
      alertDiv.style.opacity = 1;

      let button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.setAttribute('class', 'close');
      button.setAttribute('data-dismiss', 'alert');

      let span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.innerHTML = '&times;';
      button.appendChild(span);

      span = document.createElement('span');
      span.setAttribute('class', 'sr-only');
      span.innerHTML = 'Close';
      button.appendChild(span);

      alertDiv.appendChild(button);

      switch (alertUser) {
        case AlertMessageOptions.AerialImageryNotAvailable:
          alertDiv.setAttribute(
            'class',
            'tab-alert alert-no-imagery alert alert-danger alert-dismissible fade in'
          );
          break;
        case AlertMessageOptions.MapLayersNotAvailable:
          alertDiv.setAttribute(
            'class',
            'tab-alert alert-no-layers alert alert-info alert-dismissible fade in'
          );
          break;
        case AlertMessageOptions.Default:
          return;
      }
      alertContainer.appendChild(alertDiv);
      if (ac.length === 0) {
        mapEl.appendChild(alertContainer);
      }
    }

    /**
     *
     * Executes each time the view is clicked
     * @param {*} event
     */
    function executeIdentifyTask(event) {

      // closure for executeIdentifyTask
      let doTask = function doTask(response) {
        let results = response.results; // order by parid asc

        // reset this from initial value so streetmap
        // doesn't look at the wrong property, or if LAND_SQFT_CAMA is empty
        paoDetails.context.sqft = 0;

        // sort mineral rights to end when clicking parcel popup info
        sortMineral(results);

        // ***************************
        // Customize the popupTemplate
        // TODO: Use createSearchWidgetPopupTemplate
        // ***************************

        let paoPopupTemplate = new PaoPopupTemplate();

        // Set the popup template default content
        paoPopupTemplate.contentType = 'default';

        // Add view parcel action
        paoPopupTemplate.IsGoToParcel = true;

        // Add gotoBuffer menu if selection method is none or search by parcel id.
        // Add before all other actions to keep it first in menu
        if (activeWidget?.buttonId === 'bufferButton') {
          if (chosenSelectionMethod === ChosenSelectionMethodOptions.None || chosenSelectionMethod === ChosenSelectionMethodOptions.ParcelId) {
            paoPopupTemplate.IsGoToBufferParcel = true;
          }
        }

        // create the esri PopupTemplate
        paoPopupTemplate.resultCount = results.length;
        let popupTemplate = paoPopupTemplate.template();

        try {

          if (paoDetails.gis.displayPage === 'fullaerial') {
            return results.map((result) => {
              let feature = result.feature;
              let layerName = result.layerName;
              feature.attributes.layerName = layerName;
              feature.popupTemplate = popupTemplate;
              if (result.feature.attributes.LAND_SQFT_CAMA) {
                paoDetails.context.sqft =
                  result.feature.attributes.LAND_SQFT_CAMA;
              }
              return feature;
            });

          } else {

            return results.map((result) => {
              let feature = result.feature;
              let layerName = result.layerName;
              feature.attributes.layerName = layerName;
              // show the popupTemplate when multiple results when not in fullscreen
              if (results.length && results.length > 1)
                feature.popupTemplate = popupTemplate;
              if (result.feature.attributes.LAND_SQFT_CAMA) {
                paoDetails.context.sqft =
                  result.feature.attributes.LAND_SQFT_CAMA;
              }
              return feature;
            });
          }
        } catch (error) {
          console.error(error);
        }
      };

      // Shows the results of the Identify in a popup once the promise is resolved
      let showInfo = (featureSet) => {
        try {
          if (paoDetails.gis.displayPage === 'fullaerial') {
            // show popup in fullscreen for all parcels
            // exit fullscreen and switchOwner when popup button is clicked
            if (featureSet && featureSet.length > 0) {
              showPopup(featureSet, event.mapPoint);
            }
          } else {
            // show popup when not in fullscreen for any parcels with more than 1 parcel
            // switchOwner parcel when popup button is clicked
            if (featureSet && featureSet.length > 1) {
              showPopup(featureSet, event.mapPoint);
            } else {
              // do not show popup for any parcels with only 1 parcel
              // switchOwner parcel when parcel is clicked directly
              // should be only 1 parcel here
              if (featureSet && featureSet[0]) {
                let item = featureSet[0];
                global_parid = item.attributes.PARID;
                queryGeometry();
              }
            } // end featureSet check
          } // end fullscreen check
          doCursor('auto');
        } catch (error) {
          doCursor('auto');
          console.error('showInfo', error);
        } // end try
      };

      /**
       * Use when featureset exists.
       * Query features for popup.
       * 
       * @param {*} featureSet
       * @param {*} mapPoint
       */
      let showPopup = async (featureSet, mapPoint) => {
        // Use local parid.
        let parid = featureSet[0].attributes.PARID;

        // Wait for asynchronous promise before showing popup.
        await queryFeatureSet(parid);
        closeVisiblePopup();
        view.openPopup({
          features: featureSet,
          location: mapPoint   // Set the location of the popup to the clicked location
        });
      };

      // Set the geometry to the location of the view click.
      identifyParams.geometry = event.mapPoint;
      identifyParams.mapExtent = view.extent;

      let coords = {
        lat: event.mapPoint.latitude,
        lon: event.mapPoint.longitude,
      };

      paoDetails.context.datums.usesDefaults = false;
      paoDetails.context.datums.coordinates = coords;

      identify
        .identify(mapLayerAndLabelsUrl, identifyParams)
        .then(doTask)
        .then(showInfo)
      ['catch'](promiseRejected);
    }

    /**
     * The selected aerial parcel item has changed,
     * call mcpao-owner->switchOwner to switch owner data
     */
    const doSwitchOwner = async () => {
      paoDetails.gis.ownerSwitched = false;
      return true;
    };



    /**
     * Launches new tab to parcel details.
     * @param {*} response
     */
    const queryGeometryToNewWindow = async (parid) => {
      window.open(`${window.location.origin}/parcel/?parid=${parid}`, '_blank');
    };

    /**
     * Query feature geometry by parcel id.
     * @param {*} response
     */
    const queryGeometry = async () => {
      // Should be only 1 parcel here.
      let queryObject = new Query({
        returnGeometry: true,
        outFields: ['*'],
        outSpatialReference: view.spatialReference,
        orderByFields: ['PARID'],
        where: `PARID='${global_parid}'`,
      });
      query
        .executeQueryJSON(parcelSearchUrl, queryObject)
        .then(await setParcelFeatures) // Keep after execute above, result is features.
        .then(await doSwitchOwner)
        .then(doCursor('auto'))
      ['catch'](promiseRejected);
    };

    /**
     * Black font color when no aerials checked
     * Yellow font color when basemap is not an aerial
     * @param item LayerList Layeritem
     * @returns true
     * @param {*} item
     * @returns
     */
    function layerListFormat(item) {
      let aerials = item.layer.parent.allLayers.filter((a) => {
        try {
          return a.title === 'Aerials';
        } catch (error) {
          console.error('aerials: ' + error);
        }
      });
      let maplayers = item.layer.parent.allLayers.filter((a) => {
        try {
          return (
            a.title === 'Map Layers & Labels' ||
            a.title === 'Districts & PLSS Layers'
          );
        } catch (error) {
          console.error('maplayers: ' + error);
        }
      });
      LayerListAdjustBasemapFont(aerials, maplayers);
      return true;
    }

    function LayerListAdjustBasemapFont(aerials, maplayers) {
      if (maplayers) {
        if (maplayers.length > 0) {
          if (maplayers.items[0].sublayers !== null) {
            if (maplayers.items[0].sublayers.items) {
              var black = maplayers.items[0].sublayers.items.filter((a) => {
                try {
                  return a.id === 3; // Parcel Dimensions
                } catch (error) {
                  console.error('black: ' + error);
                }
              });
            }
            if (maplayers.items[0].sublayers.items) {
              var yellow = maplayers.items[0].sublayers.items.filter((a) => {
                try {
                  return a.id === 2; // Parcel Dimensions
                } catch (error) {
                  console.error('yellow: ' + error);
                }
              });
            }
            if (black && black.length > 0 && yellow && yellow.length > 0) {
              // show black when both are unchecked
              if (aerials && aerials.length > 0) {
                black[0].visible = aerials.items[0].visible === false; // show yellow when one is checked
                yellow[0].visible = aerials.items[0].visible === true; // show black when checked
              } else {
                black[0].visible = true;
                yellow[0].visible = false;
              }
              black[0].listMode = black[0].visible ? 'show' : 'hide'; // show yellow when checked
              yellow[0].listMode = yellow[0].visible ? 'show' : 'hide';
            }
          }
        }
      }
    } // end LayerListAdjustBasemapFont

    /**
     * The MapView is ready
     */
    const mapReady = async () => {

      addlayerListExpand();
      setUpGraphicClickHandler();

      // not 0
      if (global_parid?.length > 1) {
        queryFeatureSet(global_parid);
      }

      // Init identify params which will be used with the sketchViewModel when it completes.
      identifyParams = new IdentifyParameters();
      identifyParams.tolerance = 0.1;
      identifyParams.layerIds = [parcelSearchUrl];
      identifyParams.layerOption = 'top'; // Only the top-most visible layer on the service is identified.

      reactiveUtils.on(
        () => view.popup,
        'visible',
        (event) => {
          let nomap = document.getElementsByClassName('map-not-found-popup');
          if (event) {
            // opened
            // remove popup pointer if map not found
            if (nomap && nomap.length > 0) {
              let matches = document.getElementsByClassName(
                'esri-popup__pointer'
              );
              for (let i = 0; i < matches.length; i++) {
                matches[i].classList.add('d-none');
              }
            }
            closeExpanderWidgets(); // other handling
          } else {
            // closed
            // remove popup from dom when closed
            if (nomap && nomap.length > 0) {
              closeVisiblePopup();
            }
          }
        });


      // Event handler that fires each time an action is clicked.
      reactiveUtils.on(() => view.popup,
        'trigger-action',
        async (event) => {
          // The newly selected parid
          global_parid = view.popup.selectedFeature.attributes.PARID;
          // used elsewhere
          paoDetails.context.parid = paoDetails.context.datums.parid = global_parid;

          // Close the popup
          if (paoDetails.gis.displayPage === 'fullaerial') closeVisiblePopup();

          // **********************************
          // The popup menu item clicked
          // goto-parcel = View Parcel
          // goto-buffer-parcel = Buffer Parcel
          // **********************************

          switch (event.action.id) {
            case 'goto-parcel':
              await gotoParcelWorkflow();
              break;

            case 'goto-buffer-parcel':
              if (Object.keys(dgData)?.length >= MAX_DATAGRID_ITEMS)
                return notifyExceededMaxItems()

              doGotoBufferParcel();
              break;
          }


          // Closure for goto-parcel.
          async function gotoParcelWorkflow() {

            if (activeWidget?.state === 'active' && activeWidget?.buttonId === 'bufferButton') {

              // Switch to new parcel in new window.
              queryGeometryToNewWindow(global_parid);

            } else if (activeWidget?.state !== 'active' && activeWidget?.buttonId === 'bufferButton') {

              // Query selected item on map and switch owner.
              queryGeometry();
              if (chosenSelectionMethod === ChosenSelectionMethodOptions.ParcelId)
                searchParcel(global_parid);

            } else {

              // Check if has referer from Search page.
              if (paoDetails.gis.referer?.length > 0) {

                // Clear referer and begin moving to normal details mode.
                paoDetails.gis.referer = null;
                paoDetails.gis.ownerSwitched = true;

              }
              await doSwitchOwner();
            }
          }
        });

      
      let base_widgets = [];
      
      base_widgets.push(layerListExpand);

      view.ui.add(base_widgets, { position: 'top-right' });

      // Sort layer list.
      setTimeout(() => {
        layerList?.operationalItems?.reverse();
      }, 1450);

      // hits here on page load.
      if (paoDetails.gis.displayPage === 'fullaerial') {
        
        let featureLayer = map.layers.getItemAt(_get_item_at_value_);
        if (featureLayer && featureLayer.fullExtent !== null) {
          featureLayer.when(() => {
            // go to the layer's fullextent.
            view.goTo({
              target: featureLayer.fullExtent
            });
          });
        }
      }
    }; // end mapReady

    /**
     * Handle escape key event.
     */
    document.addEventListener('keydown', (e) => {
      if (e.isComposing)
        return;

      if (e.key === 'Escape') {
        if (e.cancelable) e.preventDefault();
        // Only dismiss modal when open.
        let modalEl = document.getElementById('pao-modal');
        if (modalEl?.hasAttribute('open')) {
          closeModal();
          shellAllowInteractions(true);
          return;
        }
        if (paoDetails.gis.displayPage === 'fullaerial') {
          if (paoDetails.gis.referer?.length > 0) {
            view = null;
            replaceLocationFromReferer();
            return;
          }
        }
      }
    });

    // title is used only on fullaerial when not mobile.
    if (paoDetails.gis.displayPage === 'fullaerial') {
      let isResponsiveSize = view.widthBreakpoint !== 'xsmall';
      view.watch('widthBreakpoint', (breakpoint) => {
        switch (breakpoint) {
          case 'xsmall':
            // < 545
            // Clear the view's default UI components if
            // app is used on a small device.
            view.ui.components = [];

            if (view.ui.components.length === 1) {
              view.ui.components = [
                'attribution',
                'navigation-toggle',
                'compass',
                'zoom',
              ];
            }
            break;
          case 'small': // 545 - 768
          case 'medium': // 769 - 992
          case 'large': // 993 - 1200
          case 'xlarge': // > 1200
            break;
        }
      });
    }



    /**
     * Use for map popups.
     */
    function closeVisiblePopup() {
      if (view?.popup?.visible) view.popup.close();
    }

    /**
     * Disable or enable a control.
     * @param {*} item 
     * @param {*} allow 
     */
    const toggleControlDisabled = async (item, allow) => {
      let el = document.getElementById(item);
      // Set or remove disable attribute.
      if (el) allow ? el.removeAttribute('disabled') : el.setAttribute('disabled', '');
    }


    /**
     * Animated label.
     * @param {*} element
     * @param {*} msg
     * @param {*} duration
     */
    function labelErrorMessage(element, msg, duration) {
      let el = document.getElementById(element);
      if (el) {
        el.innerHTML = msg;
        el.classList.add('shake');
        setTimeout(() => {
          el.innerHTML = '';
          el.classList.remove('shake');
        }, duration);
      }
    }

    /**
     * Handles allowable keys for search by parcel Id.
     * TODO: check mac key codes
     * Keycodes evaluated here.
     * support shift+ins     
     * @param {*} event
     * @returns
     */
    const logKey = (event) => {
      let e = event;
      // Allow: backspace, delete
      if (
        $.inArray(e.keyCode, [46, 8]) !== -1 ||
        // Allow: Ctrl+A,Ctrl+C,Ctrl+V, Ctrl+X, Command+A
        ((e.keyCode == 65 ||
          e.keyCode == 86 ||
          e.keyCode == 67 ||
          e.keyCode == 88) &&
          (e.ctrlKey === true || e.metaKey === true)) ||
        // Allow: home, end, left, right, down, up
        (e.keyCode >= 35 && e.keyCode <= 40)
      ) {
        // let it happen
        return;
      } else {
        // Ensure that it is a number and stop the keypress
        if (
          (e.ctrlKey === false || e.metaKey === false) &&
          e.keyCode !== 17 &&
          e.keyCode !== 13 &&
          (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
          (e.keyCode < 96 || e.keyCode > 105)
        ) {
          if (e.cancelable) e.preventDefault();
          labelErrorMessage(
            'pao-parcel-search-notfound',
            'Numbers only.',
            3000
          );
        }
        if (e.key === 'Enter')
          document.getElementById('pao-parcel-search-go').click();
      }
    };


    /**
     * 
     * @param {*} zoom 
     * @returns 
     */
    const gotoZoom = async (zoom) => {
      return new Promise((resolve) => {

        view.goTo({
          target: view.extent,
          zoom: zoom
        }, animationOptions)
          .then(() => {
            resolve(true);
          });

      }).catch((error) => {
        console.error('gotoZoom', error);
        resolve(false);
      });
    };

    /**
     * Helper to close modal dialog by id.
     * Do not reset sketchview here.
     */
    const closeModal = () => {
      modalActive = false;
      document.querySelector('[id=pao-modal]')?.remove();
    };

    // *** end all
    return true;
  }); // end require


  /**
   * PopupTemplate
   * Set actions items true to show in popup template
   * https://developers.arcgis.com/javascript/latest/api-reference/esri-PopupTemplate.html
   */
  class PaoPopupTemplate {
    constructor() { }
    _goToContent = null;
    _isGoToBufferParcel = false;
    _isGoToParcel = false;
    _goToActions = [];
    _resultCount = 0;

    set IsGoToParcel(value) {
      this._isGoToParcel = value;
    }
    set IsGoToBufferParcel(value) {
      this._isGoToBufferParcel = value;
    }
    get resultCount() {
      return this._resultCount;
    }
    set resultCount(value) {
      this._resultCount = value;
    }

    // popup goTo content
    set contentType(value) {
      switch (value) {
        case 'default':

          this._goToContent = "<div class='pao-esri-pop-content'><div><span class='pao-black'>Owner:</span><span class='pao-blue'> {PAR_OWNER_NAME1}</span></div>" +
            "<div><span class='pao-black'>Neighborhood:</span><span class='pao-blue'> {PAR_NBHD_NAME}</span></div>" +
            "<div><span class='pao-black'>Situs:</span><span class='pao-blue'> {SITUS_ADDRESS}</span></div>" +
            "<div><span class='pao-black'>{expression/SALE_DATE_LQ-label}</span><span class='pao-blue'>{expression/SALE_DATE_LQ}</span></div>" +
            "<div><span class='pao-black'>{expression/SALE_PRICE_LQ-label}</span><span class='pao-blue'>{expression/SALE_PRICE_LQ}</span></div>" +
            "<div><span class='pao-black'>{expression/SALE_VORI_LQ-label}</span><span class='pao-blue'>{expression/SALE_VORI_LQ}</span></div>" +
            "<div><span class='pao-black'>{expression/SALE_CODE_LQ-label}</span><span class='pao-blue'>{expression/SALE_CODE_LQ}</span></div>" +
            '</div>'
          break;
        // add others here
      }
    }
    buildGoToActions = () => {

      // popup goTo action items
      // image is shown in title
      // actions order left to right

      // Buffer popup template

      if (this._isGoToBufferParcel) {
        this._goToActions.push({
          title: 'Buffer Parcel',
          id: 'goto-buffer-parcel',
          image: 'buffer.png',
        });
      }

      // Parcel popup template

      if (this._isGoToParcel) {
        let image = 'view-parcel.png';
        if (this._isGoToBufferParcel)
          image = 'external-link.png';

        this._goToActions.push({
          title: ' View Parcel',
          id: 'goto-parcel',
          image: image
        });
      }

    };
    //
    template = () => {
      this.buildGoToActions();
      let _menu_content = '';
      // Show situs when more than 1 item in menu list.
      //if (this._resultCount > 1) {
      //  _menu_content = `<span class='pao-black'>Parcel ID:</span><span class='pao-blue'> {PARID}</span><span class='pao-black'>, Situs:</span><span class='pao-blue'> {SITUS_ADDRESS}</span>`;
      //} else {
      _menu_content = `<span class='pao-black'>Parcel ID:</span><span class='pao-blue'> {PARID}</span>`;
      //}

      return {
        title: `<div class='pao-esri-pop-title'>${_menu_content}</div>`,
        content: this._goToContent,
        actions: this._goToActions,
        expressionInfos: [
          {
            name: 'SALE_DATE_LQ-label',
            expression:
              "IIf(IsEmpty($feature.SALE_DATE_LQ), '', 'Last Qualified Sale Date: ')",
          },
          {
            name: 'SALE_DATE_LQ',
            // format epoch date and add comma with trailing space if not empty
            expression:
              "IIf(IsEmpty($feature.SALE_DATE_LQ), '', Text(Date($feature.SALE_DATE_LQ), 'M/D/YYYY'))",
          },
          {
            name: 'SALE_PRICE_LQ-label',
            expression:
              "IIf(IsEmpty($feature.SALE_PRICE_LQ), '', 'Last Qualified Sale Price: ')",
          },
          {
            name: 'SALE_PRICE_LQ',
            expression:
              "IIf(IsEmpty($feature.SALE_PRICE_LQ), '', Text(Number($feature.SALE_PRICE_LQ *1, 0), '$###,###.##'))",
          },
          {
            name: 'SALE_VORI_LQ-label',
            expression:
              "IIf(IsEmpty($feature.SALE_VORI_LQ), '', 'Vacant or Improved: ')",
          },
          {
            name: 'SALE_VORI_LQ',
            expression:
              "IIf(IsEmpty($feature.SALE_VORI_LQ), '', IIf(Upper($feature.SALE_VORI_LQ) == 'V', 'Vacant', 'Improved'))",
          },
          {
            name: 'SALE_CODE_LQ-label',
            expression:
              "IIf(IsEmpty($feature.SALE_CODE_LQ), '', 'Qualification Code: ')",
          },
          {
            name: 'SALE_CODE_LQ',
            expression:
              "IIf(IsEmpty($feature.SALE_CODE_LQ), '', $feature.SALE_CODE_LQ)",
          },
        ],
      };
    }
  }


  /**
   * Calcite alert color properties.
   */
  class AlertKind {
    constructor() { }
    static Brand = 'brand';
    static Danger = 'danger';
    static Info = '';
    static Success = 'success';
    static Warning = 'warning';
  }

  /**
   * set auto_close to true to not overlap multiple alerts
   */
  class PaoAlert extends AlertKind {
    constructor() { }
    static calciteAlert = (
      id,
      kind,
      icon,
      scale = 'm',
      placement = 'top',
      title,
      message,
      auto_close = false,
      auto_close_speed = 'fast'
    ) => {

      let el = document.querySelectorAll('#calcite-alert');
      if (el?.length > 1)
        id = `${id}-${el?.length + 1}`;

      if (!icon)
        icon = '';

      let pao_alert = document.createElement('calcite-alert');
      pao_alert.setAttribute('id', id);
      pao_alert.setAttribute('open', '');
      pao_alert.setAttribute('kind', kind);
      pao_alert.setAttribute('placement', placement);
      pao_alert.setAttribute('icon', icon);
      pao_alert.setAttribute('scale', scale);
      if (auto_close) {
        pao_alert.setAttribute('auto-close', null);
        pao_alert.setAttribute('auto-close-duration', auto_close_speed);
      }
      pao_alert.setFocus();
      pao_alert.addEventListener('calciteAlertClose', (event) => {
        if (event?.target?.id != null) {
          let id = event.target.id;
          let el = document.getElementById(id);
          if (el) el.remove();
        }
      });

      let _title = document.createElement('div');
      _title.setAttribute('slot', 'title');
      _title.innerHTML = `${title}`;

      pao_alert.appendChild(_title);

      let _message = document.createElement('div');
      _message.setAttribute('slot', 'message');
      _message.innerHTML = `${message}`;

      pao_alert.appendChild(_message);

      let shell = document.getElementById('pao-shell');
      if (shell) shell.appendChild(pao_alert);
      return id;
    };
  }

  /**
   * Creates an error alert
   */
  class PaoError extends PaoAlert {
    constructor() { }
    static showAlert = ({
      title,
      message,
      scale,
      placement,
      auto_close,
      auto_close_speed,
    }) => {
      this.calciteAlert(
        'pao-shell-error-alert',
        this.Danger,
        'exclamation-mark-triangle',
        scale,
        placement,
        title,
        message,
        auto_close,
        auto_close_speed
      );
    };
  }
  /**
   * Creates a warning alert
   */
  class PaoWarning extends PaoAlert {
    constructor() { }
    static showAlert = ({
      title,
      message,
      scale,
      placement,
      auto_close,
      auto_close_speed,
    }) => {
      this.calciteAlert(
        'pao-shell-warning-alert',
        this.Warning,
        'exclamation-mark-triangle',
        scale,
        placement,
        title,
        message,
        auto_close,
        auto_close_speed
      );
    };
  }
  /**
   * Creates a success alert
   */
  class PaoSuccess extends PaoAlert {
    constructor() { }
    static showAlert = ({
      title,
      message,
      scale,
      placement,
      auto_close,
      auto_close_speed,
    }) => {
      this.calciteAlert(
        'pao-shell-success-alert',
        this.Success,
        'check-circle',
        scale,
        placement,
        title,
        message,
        auto_close,
        auto_close_speed
      );
    };
  }
  /**
   * Creates an info alert
   */
  class PaoInfo extends PaoAlert {
    constructor() { }
    static showAlert = ({
      title,
      message,
      scale,
      placement,
      auto_close,
      auto_close_speed,
      icon
    }) => {
      return this.calciteAlert(
        'pao-shell-info-alert',
        this.Info,
        icon, //'information',
        scale,
        placement,
        title,
        message,
        auto_close,
        auto_close_speed
      );
    };
  }
  }); // end JS